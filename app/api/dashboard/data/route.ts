import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"
import { FacebookInsightsService } from "@/lib/insights/facebook-insights"
import { InstagramInsightsService } from "@/lib/insights/instagram-insights"
import { TwitterInsightsService } from "@/lib/insights/twitter-insights"
import { withAuth } from "@/lib/middleware"
import { logger } from "@/lib/logger"

async function handler(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request)

  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Get user's active auth providers
    const activeProviders = await UserService.getActiveProviders(session.userId)

    const dashboardData: any = {
      overview: {
        totalReach: 0,
        totalEngagement: 0,
        totalFollowers: 0,
        engagementRate: 0,
      },
      lastUpdated: new Date().toISOString(),
    }

    // Fetch data from each connected platform
    for (const provider of activeProviders) {
      try {
        switch (provider.provider) {
          case "facebook":
            if (!UserService.isTokenExpired(provider)) {
              const facebookData = await FacebookInsightsService.getInsights(provider.accessToken)
              dashboardData.facebook = facebookData

              // Add to overview
              dashboardData.overview.totalFollowers += facebookData.pageData?.fan_count || 0
              dashboardData.overview.totalReach += facebookData.insights?.reach || 0
              dashboardData.overview.totalEngagement += facebookData.insights?.engagement || 0
            }
            break

          case "instagram":
            if (!UserService.isTokenExpired(provider)) {
              const instagramData = await InstagramInsightsService.getInsights(provider.accessToken)
              dashboardData.instagram = instagramData

              // Add to overview
              dashboardData.overview.totalFollowers += instagramData.profile?.followers_count || 0
              dashboardData.overview.totalReach += instagramData.insights?.reach || 0
              dashboardData.overview.totalEngagement += instagramData.insights?.engagement || 0
            }
            break

          case "twitter":
            if (!UserService.isTokenExpired(provider)) {
              const twitterData = await TwitterInsightsService.getInsights(provider.accessToken)
              dashboardData.twitter = twitterData

              // Add to overview
              dashboardData.overview.totalFollowers += twitterData.profile?.public_metrics?.followers_count || 0
              dashboardData.overview.totalReach += twitterData.analytics?.impressions || 0
              dashboardData.overview.totalEngagement += twitterData.analytics?.engagements || 0
            }
            break
        }
      } catch (providerError) {
        logger.warn(`Failed to fetch data for ${provider.provider}`, {
          error: providerError,
          userId: session.userId,
          provider: provider.provider,
        })
        // Continue with other providers even if one fails
      }
    }

    // Calculate engagement rate
    if (dashboardData.overview.totalReach > 0) {
      dashboardData.overview.engagementRate =
        (dashboardData.overview.totalEngagement / dashboardData.overview.totalReach) * 100
    }

    logger.info("Dashboard data fetched successfully", {
      userId: session.userId,
      providers: activeProviders.map((p) => p.provider),
    })

    return NextResponse.json(dashboardData)
  } catch (error) {
    logger.error("Failed to fetch dashboard data", {
      error,
      userId: session.userId,
    })

    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}

export const GET = withAuth(handler)
