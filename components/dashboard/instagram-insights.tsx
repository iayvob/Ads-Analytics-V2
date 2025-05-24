"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "./metric-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Users, Eye, Heart, Camera } from "lucide-react"

interface InstagramInsightsProps {
  data?: any
}

export function InstagramInsights({ data }: InstagramInsightsProps) {
  const profile = data?.profile || {}
  const insights = data?.insights || {}
  const media = data?.media || []

  // Sample data for demonstration
  const weeklyGrowth = [
    { date: "Week 1", followers: 1200, engagement: 180 },
    { date: "Week 2", followers: 1250, engagement: 195 },
    { date: "Week 3", followers: 1180, engagement: 165 },
    { date: "Week 4", followers: 1320, engagement: 220 },
  ]

  const contentTypes = [
    { name: "Photos", value: 45, color: "#e91e63" },
    { name: "Videos", value: 30, color: "#9c27b0" },
    { name: "Reels", value: 20, color: "#673ab7" },
    { name: "Stories", value: 5, color: "#3f51b5" },
  ]

  const topHashtags = [
    { tag: "#photography", posts: 45, reach: 12000 },
    { tag: "#lifestyle", posts: 38, reach: 9800 },
    { tag: "#travel", posts: 32, reach: 8500 },
    { tag: "#fashion", posts: 28, reach: 7200 },
    { tag: "#food", posts: 25, reach: 6800 },
  ]

  const storyMetrics = [
    { date: "Mon", views: 850, completion: 65 },
    { date: "Tue", views: 920, completion: 72 },
    { date: "Wed", views: 780, completion: 58 },
    { date: "Thu", views: 1100, completion: 78 },
    { date: "Fri", views: 1250, completion: 82 },
    { date: "Sat", views: 1400, completion: 85 },
    { date: "Sun", views: 1300, completion: 80 },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard
          title="Followers"
          value={profile.followers_count?.toLocaleString() || "0"}
          icon={Users}
          trend={3}
          description="Total followers"
        />
        <MetricCard
          title="Profile Views"
          value={insights.profile_views?.toLocaleString() || "0"}
          icon={Eye}
          trend={15}
          description="Last 7 days"
        />
        <MetricCard
          title="Avg. Engagement"
          value={insights.avg_engagement?.toLocaleString() || "0"}
          icon={Heart}
          trend={7}
          description="Per post"
        />
        <MetricCard
          title="Story Views"
          value={insights.story_views?.toLocaleString() || "0"}
          icon={Camera}
          trend={12}
          description="Daily average"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Follower Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Follower Growth</CardTitle>
            <CardDescription>Weekly follower count and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                followers: {
                  label: "Followers",
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
                <LineChart data={weeklyGrowth}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="followers" stroke="var(--color-followers)" strokeWidth={2} />
                  <Line type="monotone" dataKey="engagement" stroke="var(--color-engagement)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Content Distribution */}
        <Card>
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
                    label={({ name, value }) => `${name}: ${value}%`}
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

        {/* Story Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Story Performance</CardTitle>
            <CardDescription>Daily story views and completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                views: {
                  label: "Views",
                  color: "hsl(var(--chart-3))",
                },
                completion: {
                  label: "Completion %",
                  color: "hsl(var(--chart-4))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={storyMetrics}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="views" fill="var(--color-views)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Hashtags */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Hashtags</CardTitle>
            <CardDescription>Your most effective hashtags</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topHashtags.map((hashtag, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{hashtag.tag}</p>
                    <p className="text-xs text-gray-500">{hashtag.posts} posts</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-pink-600">{hashtag.reach.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">reach</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts Performance</CardTitle>
          <CardDescription>Your latest content engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { type: "Photo", likes: 245, comments: 18, shares: 12, date: "2 hours ago" },
              { type: "Reel", likes: 892, comments: 45, shares: 67, date: "1 day ago" },
              { type: "Video", likes: 156, comments: 23, shares: 8, date: "2 days ago" },
            ].map((post, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{post.type}</span>
                  <span className="text-xs text-gray-500">{post.date}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-semibold text-pink-600">{post.likes}</div>
                    <div className="text-xs text-gray-500">Likes</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{post.comments}</div>
                    <div className="text-xs text-gray-500">Comments</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">{post.shares}</div>
                    <div className="text-xs text-gray-500">Shares</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
