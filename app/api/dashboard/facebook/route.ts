import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"
import { FacebookApiClient } from "@/lib/api-clients/facebook-client"
import { withAuth } from "@/lib/middleware"
import { logger } from "@/lib/logger"
import { z } from "zod"

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

const requestSchema = z.object({
  period: z.enum(["day", "week", "days_28"]).optional().default("week"),
  includePosts: z.boolean().optional().default(true),
  includeAds: z.boolean().optional().default(true),
})

async function handler(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request)

  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Parse request body for options
    let options: z.infer<typeof requestSchema> = { period: "week", includePosts: true, includeAds: true }

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}))
      const parsed = requestSchema.safeParse(body)
      if (parsed.success) {
        options = parsed.data
      }
    }

    // Get user's Facebook auth provider
    const activeProviders = await UserService.getActiveProviders(session.userId)
    const facebookProvider = activeProviders.find((p) => p.provider === "facebook")

    if (!facebookProvider) {
      return NextResponse.json({ error: "Facebook account not connected" }, { status: 404 })
    }

    // Check if token is expired
    if (UserService.isTokenExpired(facebookProvider)) {
      return NextResponse.json({ error: "Facebook token expired" }, { status: 401 })
    }

    let facebookData: any = {}
    let useMockData = false

    try {
      // Fetch real data from Facebook API
      const [pageData, insights, adAccounts, posts] = await Promise.allSettled([
        FacebookApiClient.getPageData(facebookProvider.accessToken),
        FacebookApiClient.getInsights(facebookProvider.accessToken, options.period),
        options.includeAds ? FacebookApiClient.getAdAccounts(facebookProvider.accessToken) : Promise.resolve([]),
        options.includePosts ? FacebookApiClient.getPosts(facebookProvider.accessToken, 10) : Promise.resolve([]),
      ])

      // Process results and handle failures gracefully
      facebookData = {
        pageData: pageData.status === "fulfilled" ? pageData.value : null,
        insights: insights.status === "fulfilled" ? insights.value : null,
        adAccounts: adAccounts.status === "fulfilled" ? adAccounts.value : [],
        posts: posts.status === "fulfilled" ? posts.value : [],
        lastUpdated: new Date().toISOString(),
        dataSource: "api",
      }

      // If critical data failed to load, use mock data
      if (!facebookData.pageData || !facebookData.insights) {
        logger.warn("Critical Facebook data failed to load, using mock data", {
          userId: session.userId,
          pageDataFailed: !facebookData.pageData,
          insightsFailed: !facebookData.insights,
        })
        useMockData = true
      }
    } catch (error) {
      logger.error("Facebook API request failed", { error, userId: session.userId })
      useMockData = true
    }

    // Use mock data as fallback
    if (useMockData) {
      const mockData = FacebookApiClient.generateMockData()
      facebookData = {
        ...mockData,
        lastUpdated: new Date().toISOString(),
        dataSource: "mock",
      }

      logger.info("Using Facebook mock data", { userId: session.userId })
    }

    // Calculate additional metrics
    if (facebookData.insights && facebookData.pageData) {
      facebookData.metrics = {
        engagementRate:
          facebookData.insights.reach > 0 ? (facebookData.insights.engagement / facebookData.insights.reach) * 100 : 0,
        impressionsPerFollower:
          facebookData.pageData.fan_count > 0 ? facebookData.insights.impressions / facebookData.pageData.fan_count : 0,
        avgPostEngagement:
          facebookData.posts?.length > 0
            ? facebookData.posts.reduce((sum: number, post: any) => {
                const likes = post.likes?.summary?.total_count || 0
                const comments = post.comments?.summary?.total_count || 0
                const shares = post.shares?.count || 0
                return sum + likes + comments + shares
              }, 0) / facebookData.posts.length
            : 0,
      }
    }

    logger.info("Facebook data fetched successfully", {
      userId: session.userId,
      dataSource: facebookData.dataSource,
      pageId: facebookData.pageData?.id,
      postsCount: facebookData.posts?.length || 0,
      adAccountsCount: facebookData.adAccounts?.length || 0,
    })

    return NextResponse.json(facebookData)
  } catch (error) {
    logger.error("Failed to fetch Facebook dashboard data", {
      error,
      userId: session.userId,
    })

    // Return mock data as final fallback
    const mockData = FacebookApiClient.generateMockData()
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
