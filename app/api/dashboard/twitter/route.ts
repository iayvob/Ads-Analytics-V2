import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"
import { TwitterApiClient } from "@/lib/api-clients/twitter-client"
import { withAuth } from "@/lib/middleware"
import { logger } from "@/lib/logger"
import { z } from "zod"

const requestSchema = z.object({
  includeTweets: z.boolean().optional().default(true),
  includeMentions: z.boolean().optional().default(true),
  tweetsLimit: z.number().min(1).max(100).optional().default(10),
  mentionsLimit: z.number().min(1).max(100).optional().default(10),
})

async function handler(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request)

  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Parse request body for options
    let options = {
      includeTweets: true,
      includeMentions: true,
      tweetsLimit: 10,
      mentionsLimit: 10,
    }

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}))
      const parsed = requestSchema.safeParse(body)
      if (parsed.success) {
        options = parsed.data
      }
    }

    // Get user's Twitter auth provider
    const activeProviders = await UserService.getActiveProviders(session.userId)
    const twitterProvider = activeProviders.find((p) => p.provider === "twitter")

    if (!twitterProvider) {
      return NextResponse.json({ error: "Twitter account not connected" }, { status: 404 })
    }

    // Check if token is expired
    if (UserService.isTokenExpired(twitterProvider)) {
      return NextResponse.json({ error: "Twitter token expired" }, { status: 401 })
    }

    let twitterData: any = {}
    let useMockData = false

    try {
      // Fetch real data from Twitter API
      const userDataResult = await TwitterApiClient.getUserData(twitterProvider.accessToken)

      const [tweets, analytics, mentions] = await Promise.allSettled([
        options.includeTweets
          ? TwitterApiClient.getTweets(twitterProvider.accessToken, userDataResult.id, options.tweetsLimit)
          : Promise.resolve([]),
        TwitterApiClient.getAnalytics(twitterProvider.accessToken, userDataResult.id),
        options.includeMentions
          ? TwitterApiClient.getMentions(twitterProvider.accessToken, userDataResult.id, options.mentionsLimit)
          : Promise.resolve([]),
      ])

      // Process results and handle failures gracefully
      twitterData = {
        userData: userDataResult,
        tweets: tweets.status === "fulfilled" ? tweets.value : [],
        analytics: analytics.status === "fulfilled" ? analytics.value : null,
        mentions: mentions.status === "fulfilled" ? mentions.value : [],
        lastUpdated: new Date().toISOString(),
        dataSource: "api",
      }

      // If critical data failed to load, use mock data
      if (!twitterData.userData || !twitterData.analytics) {
        logger.warn("Critical Twitter data failed to load, using mock data", {
          userId: session.userId,
          userDataFailed: !twitterData.userData,
          analyticsFailed: !twitterData.analytics,
        })
        useMockData = true
      }
    } catch (error) {
      logger.error("Twitter API request failed", { error, userId: session.userId })
      useMockData = true
    }

    // Use mock data as fallback
    if (useMockData) {
      const mockData = TwitterApiClient.generateMockData()
      twitterData = {
        ...mockData,
        lastUpdated: new Date().toISOString(),
        dataSource: "mock",
      }

      logger.info("Using Twitter mock data", { userId: session.userId })
    }

    // Calculate additional metrics
    if (twitterData.tweets && twitterData.userData && twitterData.analytics) {
      const totalLikes = twitterData.tweets.reduce(
        (sum: number, tweet: any) => sum + (tweet.public_metrics.like_count || 0),
        0,
      )
      const totalRetweets = twitterData.tweets.reduce(
        (sum: number, tweet: any) => sum + (tweet.public_metrics.retweet_count || 0),
        0,
      )
      const totalReplies = twitterData.tweets.reduce(
        (sum: number, tweet: any) => sum + (tweet.public_metrics.reply_count || 0),
        0,
      )
      const totalImpressions = twitterData.tweets.reduce(
        (sum: number, tweet: any) => sum + (tweet.public_metrics.impression_count || 0),
        0,
      )

      twitterData.metrics = {
        avgLikesPerTweet: twitterData.tweets.length > 0 ? totalLikes / twitterData.tweets.length : 0,
        avgRetweetsPerTweet: twitterData.tweets.length > 0 ? totalRetweets / twitterData.tweets.length : 0,
        avgRepliesPerTweet: twitterData.tweets.length > 0 ? totalReplies / twitterData.tweets.length : 0,
        avgImpressionsPerTweet: twitterData.tweets.length > 0 ? totalImpressions / twitterData.tweets.length : 0,
        engagementTypes: {
          likes: totalLikes,
          retweets: totalRetweets,
          replies: totalReplies,
          quotes: twitterData.tweets.reduce(
            (sum: number, tweet: any) => sum + (tweet.public_metrics.quote_count || 0),
            0,
          ),
        },
        followerEngagementRate:
          twitterData.userData.public_metrics.followers_count > 0
            ? (twitterData.analytics.engagements / twitterData.userData.public_metrics.followers_count) * 100
            : 0,
      }

      // Get top performing tweets
      twitterData.topTweets = twitterData.tweets
        .sort((a: any, b: any) => {
          const aEngagement =
            a.public_metrics.like_count + a.public_metrics.retweet_count + a.public_metrics.reply_count
          const bEngagement =
            b.public_metrics.like_count + b.public_metrics.retweet_count + b.public_metrics.reply_count
          return bEngagement - aEngagement
        })
        .slice(0, 5)

      // Analyze tweet timing
      const tweetsByHour = new Array(24).fill(0)
      twitterData.tweets.forEach((tweet: any) => {
        const hour = new Date(tweet.created_at).getHours()
        tweetsByHour[hour]++
      })

      twitterData.tweetTiming = {
        hourlyDistribution: tweetsByHour,
        mostActiveHour: tweetsByHour.indexOf(Math.max(...tweetsByHour)),
      }
    }

    logger.info("Twitter data fetched successfully", {
      userId: session.userId,
      dataSource: twitterData.dataSource,
      username: twitterData.userData?.username,
      tweetsCount: twitterData.tweets?.length || 0,
      mentionsCount: twitterData.mentions?.length || 0,
    })

    return NextResponse.json(twitterData)
  } catch (error) {
    logger.error("Failed to fetch Twitter dashboard data", {
      error,
      userId: session.userId,
    })

    // Return mock data as final fallback
    const mockData = TwitterApiClient.generateMockData()
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
