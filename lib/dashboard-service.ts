import { UserService } from "./user-service"
import { FacebookApiClient, type FacebookData } from "./api-clients/facebook-client"
import { InstagramApiClient, type InstagramData } from "./api-clients/instagram-client"
import { TwitterApiClient, type TwitterData } from "./api-clients/twitter-client"
import { logger } from "./logger"

export interface DashboardOverview {
  totalReach: number
  totalEngagement: number
  totalFollowers: number
  engagementRate: number
  totalImpressions: number
  totalPosts: number
}

export interface DashboardData {
  overview: DashboardOverview
  facebook?: FacebookData
  instagram?: InstagramData
  twitter?: TwitterData
  lastUpdated: string
  connectedPlatforms: string[]
}

export class DashboardService {
  /**
   * Fetch comprehensive dashboard data for a user
   */
  static async getDashboardData(userId: string): Promise<DashboardData> {
    const activeProviders = await UserService.getActiveProviders(userId)

    const dashboardData: DashboardData = {
      overview: {
        totalReach: 0,
        totalEngagement: 0,
        totalFollowers: 0,
        engagementRate: 0,
        totalImpressions: 0,
        totalPosts: 0,
      },
      lastUpdated: new Date().toISOString(),
      connectedPlatforms: activeProviders.map((p) => p.provider),
    }

    // Fetch data from each platform
    const platformPromises = activeProviders.map((provider) => this.fetchPlatformData(provider))

    const results = await Promise.allSettled(platformPromises)

    // Process results and aggregate data
    results.forEach((result, index) => {
      const provider = activeProviders[index]

      if (result.status === "fulfilled" && result.value) {
        if (provider.provider === 'facebook') {
          dashboardData.facebook = result.value as FacebookData;
        } else if (provider.provider === 'instagram') {
          dashboardData.instagram = result.value as InstagramData;
        } else if (provider.provider === 'twitter') {
          dashboardData.twitter = result.value as TwitterData;
        }
        this.aggregateOverviewData(dashboardData.overview, provider.provider, result.value)
      } else {
        logger.warn(`Failed to fetch ${provider.provider} data`, {
          userId,
          provider: provider.provider,
          error: result.status === "rejected" ? result.reason : "Unknown error",
        })
      }
    })

    // Calculate engagement rate
    if (dashboardData.overview.totalReach > 0) {
      dashboardData.overview.engagementRate =
        (dashboardData.overview.totalEngagement / dashboardData.overview.totalReach) * 100
    }

    logger.info("Dashboard data compiled successfully", {
      userId,
      platforms: dashboardData.connectedPlatforms,
      totalFollowers: dashboardData.overview.totalFollowers,
    })

    return dashboardData
  }

  /**
   * Fetch data for a specific platform
   */
  static async getPlatformData(
    userId: string,
    platform: "facebook" | "instagram" | "twitter",
  ): Promise<FacebookData | InstagramData | TwitterData> {
    const activeProviders = await UserService.getActiveProviders(userId)
    const provider = activeProviders.find((p) => p.provider === platform)

    if (!provider) {
      throw new Error(`${platform} account not connected`)
    }

    if (UserService.isTokenExpired(provider)) {
      throw new Error(`${platform} token expired`)
    }

    return this.fetchPlatformData(provider)
  }

  private static async fetchPlatformData(provider: any) {
    switch (provider.provider) {
      case "facebook":
        return FacebookApiClient.fetchData(provider.accessToken)
      case "instagram":
        return InstagramApiClient.fetchData(provider.accessToken)
      case "twitter":
        return TwitterApiClient.fetchData(provider.accessToken)
      default:
        throw new Error(`Unsupported platform: ${provider.provider}`)
    }
  }

  private static aggregateOverviewData(overview: DashboardOverview, platform: string, data: any) {
    switch (platform) {
      case "facebook":
        overview.totalFollowers += data.pageData?.fan_count || 0
        overview.totalReach += data.insights?.reach || 0
        overview.totalEngagement += data.insights?.engagement || 0
        overview.totalImpressions += data.insights?.impressions || 0
        overview.totalPosts += data.posts?.length || 0
        break

      case "instagram":
        overview.totalFollowers += data.profile?.followers_count || 0
        overview.totalReach += data.insights?.reach || 0
        overview.totalImpressions += data.insights?.impressions || 0
        overview.totalPosts += data.media?.length || 0

        // Calculate Instagram engagement from media
        const instagramEngagement =
          data.media?.reduce(
            (sum: number, item: any) => sum + (item.like_count || 0) + (item.comments_count || 0),
            0,
          ) || 0
        overview.totalEngagement += instagramEngagement
        break

      case "twitter":
        overview.totalFollowers += data.profile?.followers_count || 0
        overview.totalEngagement += data.analytics?.engagements || 0
        overview.totalImpressions += data.analytics?.impressions || 0
        overview.totalPosts += data.tweets?.length || 0

        // Estimate reach from impressions
        overview.totalReach += Math.floor((data.analytics?.impressions || 0) * 0.7)
        break
    }
  }
}
