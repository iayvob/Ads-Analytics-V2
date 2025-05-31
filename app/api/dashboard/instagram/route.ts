import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"
import { InstagramApiClient } from "@/lib/api-clients/instagram-client"
import { withAuth } from "@/lib/middleware"
import { logger } from "@/lib/logger"
import { z } from "zod"

const requestSchema = z.object({
  period: z.enum(["day", "week", "days_28"]).optional().default("week"),
  includeMedia: z.boolean().optional().default(true),
  includeStories: z.boolean().optional().default(true),
  mediaLimit: z.number().min(1).max(50).optional().default(25),
})

async function handler(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request)

  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Parse request body for options
    let options = {
      period: "week" as "day" | "week" | "days_28",
      includeMedia: true,
      includeStories: true,
      mediaLimit: 25,
    }

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}))
      const parsed = requestSchema.safeParse(body)
      if (parsed.success) {
        options = parsed.data
      }
    }

    // Get user's Instagram auth provider
    const activeProviders = await UserService.getActiveProviders(session.userId)
    const instagramProvider = activeProviders.find((p) => p.provider === "instagram")

    if (!instagramProvider) {
      return NextResponse.json({ error: "Instagram account not connected" }, { status: 404 })
    }

    // Check if token is expired
    if (UserService.isTokenExpired(instagramProvider)) {
      return NextResponse.json({ error: "Instagram token expired" }, { status: 401 })
    }

    let instagramData: any = {}
    let useMockData = false

    try {
      // Fetch real data from Instagram API
      const [profile, insights, media, stories] = await Promise.allSettled([
        InstagramApiClient.getProfile(instagramProvider.accessToken),
        InstagramApiClient.getInsights(instagramProvider.accessToken, options.period),
        options.includeMedia
          ? InstagramApiClient.getMedia(instagramProvider.accessToken, options.mediaLimit)
          : Promise.resolve([]),
        options.includeStories ? InstagramApiClient.getStories(instagramProvider.accessToken) : Promise.resolve([]),
      ])

      // Process results and handle failures gracefully
      instagramData = {
        profile: profile.status === "fulfilled" ? profile.value : null,
        insights: insights.status === "fulfilled" ? insights.value : null,
        media: media.status === "fulfilled" ? media.value : [],
        stories: stories.status === "fulfilled" ? stories.value : [],
        lastUpdated: new Date().toISOString(),
        dataSource: "api",
      }

      // If critical data failed to load, use mock data
      if (!instagramData.profile || !instagramData.insights) {
        logger.warn("Critical Instagram data failed to load, using mock data", {
          userId: session.userId,
          profileFailed: !instagramData.profile,
          insightsFailed: !instagramData.insights,
        })
        useMockData = true
      }
    } catch (error) {
      logger.error("Instagram API request failed", { error, userId: session.userId })
      useMockData = true
    }

    // Use mock data as fallback
    if (useMockData) {
      const mockData = InstagramApiClient.generateMockData()
      instagramData = {
        ...mockData,
        lastUpdated: new Date().toISOString(),
        dataSource: "mock",
      }

      logger.info("Using Instagram mock data", { userId: session.userId })
    }

    // Calculate additional metrics
    if (instagramData.insights && instagramData.profile && instagramData.media) {
      const totalEngagement = instagramData.media.reduce((sum: number, item: any) => {
        return sum + (item.like_count || 0) + (item.comments_count || 0)
      }, 0)

      const totalMediaImpressions = instagramData.media.reduce((sum: number, item: any) => {
        return sum + (item.insights?.impressions || 0)
      }, 0)

      instagramData.metrics = {
        engagementRate: instagramData.insights.reach > 0 ? (totalEngagement / instagramData.insights.reach) * 100 : 0,
        avgLikesPerPost:
          instagramData.media.length > 0
            ? instagramData.media.reduce((sum: number, item: any) => sum + (item.like_count || 0), 0) /
              instagramData.media.length
            : 0,
        avgCommentsPerPost:
          instagramData.media.length > 0
            ? instagramData.media.reduce((sum: number, item: any) => sum + (item.comments_count || 0), 0) /
              instagramData.media.length
            : 0,
        impressionsPerFollower:
          instagramData.profile.followers_count > 0 ? totalMediaImpressions / instagramData.profile.followers_count : 0,
        storiesCompletionRate:
          instagramData.stories.length > 0
            ? instagramData.stories.reduce((sum: number, story: any) => {
                const impressions = story.insights?.impressions || 0
                const exits = story.insights?.exits || 0
                return sum + (impressions > 0 ? ((impressions - exits) / impressions) * 100 : 0)
              }, 0) / instagramData.stories.length
            : 0,
      }

      // Categorize media by type
      instagramData.mediaByType = {
        images: instagramData.media.filter((item: any) => item.media_type === "IMAGE").length,
        videos: instagramData.media.filter((item: any) => item.media_type === "VIDEO").length,
        carousels: instagramData.media.filter((item: any) => item.media_type === "CAROUSEL_ALBUM").length,
      }

      // Get top performing posts
      instagramData.topPosts = instagramData.media
        .sort((a: any, b: any) => {
          const aEngagement = (a.like_count || 0) + (a.comments_count || 0)
          const bEngagement = (b.like_count || 0) + (b.comments_count || 0)
          return bEngagement - aEngagement
        })
        .slice(0, 5)
    }

    logger.info("Instagram data fetched successfully", {
      userId: session.userId,
      dataSource: instagramData.dataSource,
      username: instagramData.profile?.username,
      mediaCount: instagramData.media?.length || 0,
      storiesCount: instagramData.stories?.length || 0,
    })

    return NextResponse.json(instagramData)
  } catch (error) {
    logger.error("Failed to fetch Instagram dashboard data", {
      error,
      userId: session.userId,
    })

    // Return mock data as final fallback
    const mockData = InstagramApiClient.generateMockData()
    return NextResponse.json({
      ...mockData,
      lastUpdated: new Date().toISOString(),
      dataSource: "mock",
      error: "Failed to fetch real data, showing sample data",
    })
  }
}

export const GET = withAuth(handler)
export const POST = withAuth(handler)
