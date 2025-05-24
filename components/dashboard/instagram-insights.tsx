"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "./metric-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Users, Eye, Heart, Camera } from "lucide-react"
import { motion } from "framer-motion"
import type { InstagramData } from "@/lib/api-clients/instagram-client"

interface InstagramInsightsProps {
  data?: InstagramData & {
    dataSource?: string
    lastUpdated?: string
  }
}

export function InstagramInsights({ data }: InstagramInsightsProps) {
  if (!data) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <div className="text-gray-500">No Instagram data available</div>
        </CardContent>
      </Card>
    )
  }

  const { profile, insights, media } = data

  // Calculate average engagement
  const avgEngagement =
    media.length > 0 ? media.reduce((sum, item) => sum + item.like_count + item.comments_count, 0) / media.length : 0

  // Content type distribution
  const contentTypes = [
    { name: "Images", value: media.filter((m) => m.media_type === "IMAGE").length, color: "#e91e63" },
    { name: "Videos", value: media.filter((m) => m.media_type === "VIDEO").length, color: "#9c27b0" },
    { name: "Carousels", value: media.filter((m) => m.media_type === "CAROUSEL_ALBUM").length, color: "#673ab7" },
  ].filter((type) => type.value > 0)

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
          Data source: {data.dataSource === "mock" ? "Sample data" : "Live Instagram API"}
          {data.lastUpdated && ` • Updated: ${new Date(data.lastUpdated).toLocaleString()}`}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard
          title="Followers"
          value={profile.followers_count.toLocaleString()}
          icon={Users}
          trend={3}
          description="Total followers"
        />
        <MetricCard
          title="Profile Views"
          value={insights.profile_views.toLocaleString()}
          icon={Eye}
          trend={15}
          description="Last 7 days"
        />
        <MetricCard
          title="Avg. Engagement"
          value={Math.round(avgEngagement).toLocaleString()}
          icon={Heart}
          trend={7}
          description="Per post"
        />
        <MetricCard
          title="Total Posts"
          value={profile.media_count.toLocaleString()}
          icon={Camera}
          trend={5}
          description="Published content"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Content Distribution */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
            <CardDescription>Breakdown of your content types</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                content: {
                  label: "Content",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentTypes}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {contentTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Posts Performance */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Posts Performance</CardTitle>
            <CardDescription>Your latest content engagement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {media.slice(0, 4).map((post) => {
              const totalEngagement = post.like_count + post.comments_count
              return (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm line-clamp-2">{post.caption || `${post.media_type} post`}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(post.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-semibold text-pink-600">{totalEngagement}</div>
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
