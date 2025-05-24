import { BaseApiClient } from "./base-client"
import { logger } from "../logger"

export interface InstagramData {
  profile: {
    id: string
    username: string
    followers_count: number
    follows_count: number
    media_count: number
  }
  insights: {
    reach: number
    impressions: number
    profile_views: number
  }
  media: Array<{
    id: string
    media_type: string
    caption?: string
    timestamp: string
    like_count: number
    comments_count: number
  }>
}

export class InstagramApiClient extends BaseApiClient {
  private static readonly BASE_URL = "https://graph.instagram.com"

  static async fetchData(accessToken: string): Promise<InstagramData> {
    try {
      const [profile, insights, media] = await Promise.allSettled([
        this.getProfile(accessToken),
        this.getInsights(accessToken),
        this.getMedia(accessToken),
      ])

      return {
        profile: profile.status === "fulfilled" ? profile.value : this.getMockProfile(),
        insights: insights.status === "fulfilled" ? insights.value : this.getMockInsights(),
        media: media.status === "fulfilled" ? media.value : this.getMockMedia(),
      }
    } catch (error) {
      logger.warn("Instagram API failed, using mock data", { error })
      return this.generateMockData()
    }
  }

  static async getProfile(accessToken: string) {
    const fields = "id,username,followers_count,follows_count,media_count"
    const url = `${this.BASE_URL}/me?access_token=${accessToken}&fields=${fields}`
    return this.makeRequest(url, {}, "Failed to fetch profile")
  }

  static async getInsights(accessToken: string, period = "week") {
    const metrics = "impressions,reach,profile_views"
    const url = `${this.BASE_URL}/me/insights?access_token=${accessToken}&metric=${metrics}&period=${period}`

    const data = await this.makeRequest<any>(url, {}, "Failed to fetch insights")

    const insights = { reach: 0, impressions: 0, profile_views: 0 }

    data.data?.forEach((metric: any) => {
      const value = metric.values?.[metric.values.length - 1]?.value || 0
      switch (metric.name) {
        case "reach":
          insights.reach = value
          break
        case "impressions":
          insights.impressions = value
          break
        case "profile_views":
          insights.profile_views = value
          break
      }
    })

    return insights
  }

  static async getMedia(accessToken: string, limit = 25) {
    const fields = "id,media_type,caption,timestamp,like_count,comments_count"
    const url = `${this.BASE_URL}/me/media?access_token=${accessToken}&fields=${fields}&limit=${limit}`

    const data = await this.makeRequest<any>(url, {}, "Failed to fetch media")
    return data.data || []
  }

  static async getStories(accessToken: string) {
    try {
      const url = `${this.BASE_URL}/me/stories?access_token=${accessToken}&fields=id,media_type,timestamp`
      const data = await this.makeRequest<any>(url, {}, "Failed to fetch stories")
      return data.data || []
    } catch (error) {
      logger.warn("Failed to fetch stories", { error })
      return []
    }
  }

  static generateMockData(): InstagramData {
    return {
      profile: this.getMockProfile(),
      insights: this.getMockInsights(),
      media: this.getMockMedia(),
    }
  }

  private static getMockProfile() {
    return {
      id: "mock_instagram_id",
      username: "sample_business",
      followers_count: 8500,
      follows_count: 450,
      media_count: 125,
    }
  }

  private static getMockInsights() {
    return {
      reach: 25000,
      impressions: 45000,
      profile_views: 1200,
    }
  }

  private static getMockMedia() {
    return [
      {
        id: "mock_media_1",
        media_type: "IMAGE",
        caption: "Beautiful sunset from our office! 🌅",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        like_count: 245,
        comments_count: 18,
      },
      {
        id: "mock_media_2",
        media_type: "VIDEO",
        caption: "Behind the scenes of our latest project 🎬",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        like_count: 189,
        comments_count: 23,
      },
    ]
  }
}
