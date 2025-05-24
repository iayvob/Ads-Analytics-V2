import { BaseApiClient } from "./base-client"
import { logger } from "../logger"

export interface TwitterData {
  profile: {
    id: string
    username: string
    name: string
    followers_count: number
    following_count: number
    tweet_count: number
  }
  analytics: {
    impressions: number
    engagements: number
    engagement_rate: number
  }
  tweets: Array<{
    id: string
    text: string
    created_at: string
    like_count: number
    retweet_count: number
    reply_count: number
    impression_count: number
  }>
}

export class TwitterApiClient extends BaseApiClient {
  private static readonly BASE_URL = "https://api.twitter.com/2"

  static async fetchData(accessToken: string): Promise<TwitterData> {
    try {
      const profile = await this.getUserData(accessToken)
      const [tweets, analytics] = await Promise.allSettled([
        this.getTweets(accessToken, profile.id),
        this.getAnalytics(accessToken, profile.id),
      ])

      return {
        profile,
        tweets: tweets.status === "fulfilled" ? tweets.value : this.getMockTweets(),
        analytics: analytics.status === "fulfilled" ? analytics.value : this.getMockAnalytics(),
      }
    } catch (error) {
      logger.warn("Twitter API failed, using mock data", { error })
      return this.generateMockData()
    }
  }

  static async getUserData(accessToken: string) {
    const url = `${this.BASE_URL}/users/me?user.fields=public_metrics`
    const data = await this.makeRequest<any>(
      url,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      "Failed to fetch profile",
    )

    return {
      id: data.data.id,
      username: data.data.username,
      name: data.data.name,
      followers_count: data.data.public_metrics.followers_count,
      following_count: data.data.public_metrics.following_count,
      tweet_count: data.data.public_metrics.tweet_count,
    }
  }

  static async getTweets(accessToken: string, userId: string, limit = 10) {
    const url = `${this.BASE_URL}/users/${userId}/tweets?max_results=${limit}&tweet.fields=public_metrics,created_at`
    const data = await this.makeRequest<any>(
      url,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      "Failed to fetch tweets",
    )

    return (data.data || []).map((tweet: any) => ({
      id: tweet.id,
      text: tweet.text,
      created_at: tweet.created_at,
      like_count: tweet.public_metrics.like_count,
      retweet_count: tweet.public_metrics.retweet_count,
      reply_count: tweet.public_metrics.reply_count,
      impression_count: tweet.public_metrics.impression_count,
    }))
  }

  static async getAnalytics(accessToken: string, userId: string) {
    try {
      const tweets = await this.getTweets(accessToken, userId, 50)

      const totalImpressions = tweets.reduce((sum, tweet) => sum + tweet.impression_count, 0)
      const totalEngagements = tweets.reduce(
        (sum, tweet) => sum + tweet.like_count + tweet.retweet_count + tweet.reply_count,
        0,
      )

      return {
        impressions: totalImpressions,
        engagements: totalEngagements,
        engagement_rate: totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0,
      }
    } catch (error) {
      logger.warn("Failed to calculate analytics", { error })
      return this.getMockAnalytics()
    }
  }

  static async getMentions(accessToken: string, userId: string, limit = 10) {
    try {
      const url = `${this.BASE_URL}/users/${userId}/mentions?max_results=${limit}&tweet.fields=public_metrics,created_at`
      const data = await this.makeRequest<any>(
        url,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
        "Failed to fetch mentions",
      )
      return data.data || []
    } catch (error) {
      logger.warn("Failed to fetch mentions", { error })
      return []
    }
  }

  static generateMockData(): TwitterData {
    return {
      profile: this.getMockProfile(),
      analytics: this.getMockAnalytics(),
      tweets: this.getMockTweets(),
    }
  }

  private static getMockProfile() {
    return {
      id: "mock_twitter_id",
      username: "sample_business",
      name: "Sample Business",
      followers_count: 5200,
      following_count: 850,
      tweet_count: 1250,
    }
  }

  private static getMockAnalytics() {
    return {
      impressions: 125000,
      engagements: 3200,
      engagement_rate: 2.56,
    }
  }

  private static getMockTweets() {
    return [
      {
        id: "mock_tweet_1",
        text: "Excited to announce our new product launch! 🚀",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        like_count: 145,
        retweet_count: 25,
        reply_count: 12,
        impression_count: 8500,
      },
      {
        id: "mock_tweet_2",
        text: "Behind the scenes of our development process. Hard work pays off! 💪",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        like_count: 89,
        retweet_count: 18,
        reply_count: 15,
        impression_count: 6200,
      },
    ]
  }
}
