import { logger } from "../logger"
import { AuthError } from "../errors"

export class InstagramInsightsService {
  static async getInsights(accessToken: string) {
    try {
      const [profile, insights, media] = await Promise.all([
        this.getProfile(accessToken),
        this.getInsightsData(accessToken),
        this.getRecentMedia(accessToken),
      ])

      return {
        profile,
        insights,
        media,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      logger.error("Failed to fetch Instagram insights", { error })
      throw new AuthError("Failed to fetch Instagram data")
    }
  }

  private static async getProfile(accessToken: string) {
    try {
      const response = await fetch(
        `https://graph.instagram.com/me?access_token=${accessToken}&fields=id,username,followers_count,follows_count,media_count`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch profile data")
      }

      return await response.json()
    } catch (error) {
      logger.warn("Failed to fetch Instagram profile", { error })
      return {}
    }
  }

  private static async getInsightsData(accessToken: string) {
    try {
      const response = await fetch(
        `https://graph.instagram.com/me/insights?access_token=${accessToken}&metric=impressions,reach,profile_views&period=week`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch insights data")
      }

      const data = await response.json()

      // Process insights data
      const insights = {
        reach: 0,
        impressions: 0,
        profile_views: 0,
        engagement: 0,
        avg_engagement: 0,
        story_views: 0,
      }

      if (data.data) {
        data.data.forEach((metric: any) => {
          const latestValue = metric.values?.[metric.values.length - 1]?.value || 0

          switch (metric.name) {
            case "reach":
              insights.reach = latestValue
              break
            case "impressions":
              insights.impressions = latestValue
              break
            case "profile_views":
              insights.profile_views = latestValue
              break
          }
        })
      }

      return insights
    } catch (error) {
      logger.warn("Failed to fetch Instagram insights", { error })
      return {
        reach: 0,
        impressions: 0,
        profile_views: 0,
        engagement: 0,
        avg_engagement: 0,
        story_views: 0,
      }
    }
  }

  private static async getRecentMedia(accessToken: string) {
    try {
      const response = await fetch(
        `https://graph.instagram.com/me/media?access_token=${accessToken}&fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=10`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch media data")
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      logger.warn("Failed to fetch Instagram media", { error })
      return []
    }
  }
}
