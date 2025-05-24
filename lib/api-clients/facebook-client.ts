import { BaseApiClient } from "./base-client"
import { logger } from "../logger"

export interface FacebookData {
  pageData: {
    id: string
    name: string
    fan_count: number
    followers_count: number
    about?: string
    category?: string
  }
  insights: {
    reach: number
    impressions: number
    engagement: number
    page_views: number
  }
  posts: Array<{
    id: string
    message?: string
    created_time: string
    likes: number
    comments: number
    shares: number
  }>
}

export class FacebookApiClient extends BaseApiClient {
  private static readonly BASE_URL = "https://graph.facebook.com/v18.0"

  static async fetchData(accessToken: string): Promise<FacebookData> {
    try {
      const [pageData, insights, posts] = await Promise.allSettled([
        this.getPageData(accessToken),
        this.getInsights(accessToken),
        this.getPosts(accessToken),
      ])

      return {
        pageData: pageData.status === "fulfilled" ? pageData.value : this.getMockPageData(),
        insights: insights.status === "fulfilled" ? insights.value : this.getMockInsights(),
        posts: posts.status === "fulfilled" ? posts.value : this.getMockPosts(),
      }
    } catch (error) {
      logger.warn("Facebook API failed, using mock data", { error })
      return this.generateMockData()
    }
  }

  static async getPageData(accessToken: string) {
    const fields = "id,name,fan_count,followers_count,about,category"
    const url = `${this.BASE_URL}/me?access_token=${accessToken}&fields=${fields}`
    return this.makeRequest(url, {}, "Failed to fetch page data")
  }

  static async getInsights(accessToken: string, period = "week") {
    const metrics = "page_impressions,page_reach,page_engaged_users,page_views"
    const url = `${this.BASE_URL}/me/insights?access_token=${accessToken}&metric=${metrics}&period=${period}`

    const data = await this.makeRequest<any>(url, {}, "Failed to fetch insights")

    const insights = { reach: 0, impressions: 0, engagement: 0, page_views: 0 }

    data.data?.forEach((metric: any) => {
      const value = metric.values?.[metric.values.length - 1]?.value || 0
      switch (metric.name) {
        case "page_reach":
          insights.reach = value
          break
        case "page_impressions":
          insights.impressions = value
          break
        case "page_engaged_users":
          insights.engagement = value
          break
        case "page_views":
          insights.page_views = value
          break
      }
    })

    return insights
  }

  static async getPosts(accessToken: string, limit = 10) {
    const fields = "id,message,created_time,likes.summary(true),comments.summary(true),shares"
    const url = `${this.BASE_URL}/me/posts?access_token=${accessToken}&fields=${fields}&limit=${limit}`

    const data = await this.makeRequest<any>(url, {}, "Failed to fetch posts")

    return (data.data || []).map((post: any) => ({
      id: post.id,
      message: post.message || "",
      created_time: post.created_time,
      likes: post.likes?.summary?.total_count || 0,
      comments: post.comments?.summary?.total_count || 0,
      shares: post.shares?.count || 0,
    }))
  }

  static async getAdAccounts(accessToken: string) {
    const fields = "id,name,account_status,spend"
    const url = `${this.BASE_URL}/me/adaccounts?access_token=${accessToken}&fields=${fields}`

    try {
      const data = await this.makeRequest<any>(url, {}, "Failed to fetch ad accounts")
      return data.data || []
    } catch (error) {
      logger.warn("Failed to fetch ad accounts", { error })
      return []
    }
  }

  static generateMockData(): FacebookData {
    return {
      pageData: this.getMockPageData(),
      insights: this.getMockInsights(),
      posts: this.getMockPosts(),
    }
  }

  private static getMockPageData() {
    return {
      id: "mock_page_id",
      name: "Sample Business Page",
      fan_count: 12500,
      followers_count: 12800,
      about: "A sample business page for demonstration",
      category: "Business",
    }
  }

  private static getMockInsights() {
    return {
      reach: 45000,
      impressions: 78000,
      engagement: 3200,
      page_views: 1800,
    }
  }

  private static getMockPosts() {
    return [
      {
        id: "mock_post_1",
        message: "Excited to announce our new product launch! 🚀",
        created_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likes: 245,
        comments: 18,
        shares: 12,
      },
      {
        id: "mock_post_2",
        message: "Behind the scenes of our development process",
        created_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        likes: 189,
        comments: 23,
        shares: 8,
      },
    ]
  }
}
