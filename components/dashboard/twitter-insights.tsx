"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "./metric-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"
import { Users, Eye, Heart, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import type { TwitterData } from "@/lib/api-clients/twitter-client"

interface TwitterInsightsProps {
  data?: TwitterData & {
    dataSource?: string
    lastUpdated?: string
  }
}

export function TwitterInsights({ data }: TwitterInsightsProps) {
  if (!data) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <div className="text-gray-500">No Twitter data available</div>
        </CardContent>
      </Card>
    )
  }

  const { profile, analytics, tweets } = data

  // Daily metrics (mock data based on tweets)
  const dailyMetrics = [
    {
      date: "Mon",
      impressions: Math.floor(analytics.impressions * 0.8),
      engagements: Math.floor(analytics.engagements * 0.7),
    },
    {
      date: "Tue",
      impressions: Math.floor(analytics.impressions * 0.9),
      engagements: Math.floor(analytics.engagements * 0.8),
    },
    {
      date: "Wed",
      impressions: Math.floor(analytics.impressions * 0.85),
      engagements: Math.floor(analytics.engagements * 0.9),
    },
    {
      date: "Thu",
      impressions: Math.floor(analytics.impressions * 1.1),
      engagements: Math.floor(analytics.engagements * 1.1),
    },
    {
      date: "Fri",
      impressions: Math.floor(analytics.impressions * 1.2),
      engagements: Math.floor(analytics.engagements * 1.2),
    },
    {
      date: "Sat",
      impressions: Math.floor(analytics.impressions * 1.0),
      engagements: Math.floor(analytics.engagements * 1.0),
    },
    { date: "Sun", impressions: analytics.impressions, engagements: analytics.engagements },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Data Source Indicator */}
      {data.dataSource && (
        <div className="text-sm text-gray-500 mb-4">
          Data source: {data.dataSource === "mock" ? "Sample data" : "Live Twitter API"}
          {data.lastUpdated && ` • Updated: ${new Date(data.lastUpdated).toLocaleString()}`}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard
          title="Followers"
          value={profile.followers_count.toLocaleString()}
          icon={Users}
          trend={2}
          description="Total followers"
        />
        <MetricCard
          title="Impressions"
          value={analytics.impressions.toLocaleString()}
          icon={Eye}
          trend={18}
          description="Last 7 days"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${analytics.engagement_rate.toFixed(1)}%`}
          icon={Heart}
          trend={5}
          description="Average per tweet"
        />
        <MetricCard
          title="Total Tweets"
          value={profile.tweet_count.toLocaleString()}
          icon={TrendingUp}
          trend={3}
          description="All time"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Performance */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Daily Performance</CardTitle>
            <CardDescription>Impressions and engagements over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                impressions: {
                  label: "Impressions",
                  color: "hsl(var(--chart-1))",
                },
                engagements: {
                  label: "Engagements",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyMetrics}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="impressions" stroke="var(--color-impressions)" strokeWidth={2} />
                  <Line type="monotone" dataKey="engagements" stroke="var(--color-engagements)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Performing Tweets */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Top Performing Tweets</CardTitle>
            <CardDescription>Your most successful tweets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tweets
              .sort((a, b) => {
                const aEngagement = a.like_count + a.retweet_count + a.reply_count
                const bEngagement = b.like_count + b.retweet_count + b.reply_count
                return bEngagement - aEngagement
              })
              .slice(0, 4)
              .map((tweet, index) => {
                const totalEngagement = tweet.like_count + tweet.retweet_count + tweet.reply_count
                return (
                  <div key={tweet.id} className="flex items-start gap-4 p-3 border rounded-lg">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm line-clamp-2">{tweet.text}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{tweet.impression_count.toLocaleString()} impressions</span>
                        <span>{new Date(tweet.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">{totalEngagement}</div>
                      <div className="text-xs text-gray-500">engagements</div>
                    </div>
                  </div>
                )
              })}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
