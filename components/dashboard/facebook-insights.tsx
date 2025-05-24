"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "./metric-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"
import { Users, Eye, Heart, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import type { FacebookData } from "@/lib/api-clients/facebook-client"

interface FacebookInsightsProps {
  data?: FacebookData & {
    dataSource?: string
    lastUpdated?: string
  }
}

export function FacebookInsights({ data }: FacebookInsightsProps) {
  if (!data) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <div className="text-gray-500">No Facebook data available</div>
        </CardContent>
      </Card>
    )
  }

  const { pageData, insights, posts } = data

  // Generate sample daily metrics for chart
  const dailyMetrics = [
    { date: "Mon", reach: Math.floor(insights.reach * 0.8), engagement: Math.floor(insights.engagement * 0.7) },
    { date: "Tue", reach: Math.floor(insights.reach * 0.9), engagement: Math.floor(insights.engagement * 0.8) },
    { date: "Wed", reach: Math.floor(insights.reach * 0.85), engagement: Math.floor(insights.engagement * 0.9) },
    { date: "Thu", reach: Math.floor(insights.reach * 1.1), engagement: Math.floor(insights.engagement * 1.1) },
    { date: "Fri", reach: Math.floor(insights.reach * 1.2), engagement: Math.floor(insights.engagement * 1.2) },
    { date: "Sat", reach: Math.floor(insights.reach * 1.15), engagement: Math.floor(insights.engagement * 1.0) },
    { date: "Sun", reach: insights.reach, engagement: insights.engagement },
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
          Data source: {data.dataSource === "mock" ? "Sample data" : "Live Facebook API"}
          {data.lastUpdated && ` • Updated: ${new Date(data.lastUpdated).toLocaleString()}`}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard
          title="Page Likes"
          value={pageData.fan_count.toLocaleString()}
          icon={Users}
          trend={5}
          description="Total page followers"
        />
        <MetricCard
          title="Page Reach"
          value={insights.reach.toLocaleString()}
          icon={Eye}
          trend={12}
          description="Last 7 days"
        />
        <MetricCard
          title="Engagement"
          value={insights.engagement.toLocaleString()}
          icon={Heart}
          trend={8}
          description="Likes, comments, shares"
        />
        <MetricCard
          title="Page Views"
          value={insights.page_views.toLocaleString()}
          icon={TrendingUp}
          trend={15}
          description="Profile visits"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Performance */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Daily Performance</CardTitle>
            <CardDescription>Reach and engagement over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                reach: {
                  label: "Reach",
                  color: "hsl(var(--chart-1))",
                },
                engagement: {
                  label: "Engagement",
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
                  <Line type="monotone" dataKey="reach" stroke="var(--color-reach)" strokeWidth={2} />
                  <Line type="monotone" dataKey="engagement" stroke="var(--color-engagement)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Posts */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
            <CardDescription>Your best content this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {posts.slice(0, 4).map((post, index) => {
              const totalEngagement = post.likes + post.comments + post.shares
              return (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm line-clamp-2">{post.message || "No message"}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(post.created_time).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right ml-4">
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
