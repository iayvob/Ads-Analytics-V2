"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "./metric-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Users, Eye, Heart, TrendingUp } from "lucide-react"

interface TwitterInsightsProps {
  data?: any
}

export function TwitterInsights({ data }: TwitterInsightsProps) {
  const profile = data?.profile || {}
  const analytics = data?.analytics || {}
  const tweets = data?.tweets || []

  // Sample data for demonstration
  const dailyMetrics = [
    { date: "Mon", impressions: 12000, engagements: 450, followers: 1200 },
    { date: "Tue", impressions: 15000, engagements: 520, followers: 1205 },
    { date: "Wed", impressions: 11000, engagements: 380, followers: 1198 },
    { date: "Thu", impressions: 18000, engagements: 680, followers: 1215 },
    { date: "Fri", impressions: 22000, engagements: 890, followers: 1230 },
    { date: "Sat", impressions: 16000, engagements: 620, followers: 1225 },
    { date: "Sun", impressions: 14000, engagements: 540, followers: 1228 },
  ]

  const engagementTypes = [
    { name: "Likes", value: 45, color: "#1da1f2" },
    { name: "Retweets", value: 25, color: "#17bf63" },
    { name: "Replies", value: 20, color: "#1da1f2" },
    { name: "Clicks", value: 10, color: "#657786" },
  ]

  const topTweets = [
    { content: "Excited to announce our new product launch! 🚀", impressions: 8500, engagements: 245, date: "2h" },
    { content: "Behind the scenes of our development process", impressions: 6200, engagements: 189, date: "1d" },
    { content: "Thank you to all our amazing customers! ❤️", impressions: 5800, engagements: 156, date: "2d" },
    { content: "Industry insights: The future of technology", impressions: 4900, engagements: 134, date: "3d" },
  ]

  const audienceInterests = [
    { interest: "Technology", percentage: 35 },
    { interest: "Business", percentage: 28 },
    { interest: "Marketing", percentage: 22 },
    { interest: "Design", percentage: 15 },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard
          title="Followers"
          value={profile.public_metrics?.followers_count?.toLocaleString() || "0"}
          icon={Users}
          trend={2}
          description="Total followers"
        />
        <MetricCard
          title="Impressions"
          value={analytics.impressions?.toLocaleString() || "0"}
          icon={Eye}
          trend={18}
          description="Last 7 days"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${analytics.engagement_rate?.toFixed(1) || "0"}%`}
          icon={Heart}
          trend={5}
          description="Average per tweet"
        />
        <MetricCard
          title="Profile Visits"
          value={analytics.profile_visits?.toLocaleString() || "0"}
          icon={TrendingUp}
          trend={12}
          description="This week"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Performance */}
        <Card>
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

        {/* Engagement Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Breakdown</CardTitle>
            <CardDescription>Types of engagement on your tweets</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                engagement: {
                  label: "Engagement",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementTypes}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {engagementTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Follower Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Follower Growth</CardTitle>
            <CardDescription>Daily follower count changes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                followers: {
                  label: "Followers",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyMetrics}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="followers" fill="var(--color-followers)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Audience Interests */}
        <Card>
          <CardHeader>
            <CardTitle>Audience Interests</CardTitle>
            <CardDescription>What your followers are interested in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {audienceInterests.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.interest}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 w-8">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Tweets */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Tweets</CardTitle>
          <CardDescription>Your most successful tweets this week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {topTweets.map((tweet, index) => (
            <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm mb-2">{tweet.content}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {tweet.impressions.toLocaleString()} impressions
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {tweet.engagements} engagements
                  </span>
                  <span>{tweet.date} ago</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">{tweet.engagements}</div>
                <div className="text-xs text-gray-500">total engagements</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
