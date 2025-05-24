"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Eye, Heart } from "lucide-react"
import { MetricCard } from "./metric-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"

interface OverviewMetricsProps {
  data: any
  authStatus: {
    facebook: boolean
    instagram: boolean
    twitter: boolean
  }
}

export function OverviewMetrics({ data, authStatus }: OverviewMetricsProps) {
  const overview = data?.overview || {
    totalReach: 0,
    totalEngagement: 0,
    totalFollowers: 0,
    engagementRate: 0,
  }

  // Sample data for charts
  const platformData = [
    {
      platform: "Facebook",
      followers: data?.facebook?.pageData?.fan_count || 0,
      engagement: data?.facebook?.insights?.engagement || 0,
      reach: data?.facebook?.insights?.reach || 0,
      connected: authStatus.facebook,
    },
    {
      platform: "Instagram",
      followers: data?.instagram?.profile?.followers_count || 0,
      engagement: data?.instagram?.insights?.engagement || 0,
      reach: data?.instagram?.insights?.reach || 0,
      connected: authStatus.instagram,
    },
    {
      platform: "Twitter",
      followers: data?.twitter?.profile?.public_metrics?.followers_count || 0,
      engagement: data?.twitter?.analytics?.engagement_rate || 0,
      reach: data?.twitter?.analytics?.impressions || 0,
      connected: authStatus.twitter,
    },
  ].filter((item) => item.connected)

  const engagementTrend = [
    { date: "Mon", engagement: 120 },
    { date: "Tue", engagement: 150 },
    { date: "Wed", engagement: 180 },
    { date: "Thu", engagement: 140 },
    { date: "Fri", engagement: 200 },
    { date: "Sat", engagement: 250 },
    { date: "Sun", engagement: 220 },
  ]

  const audienceData = [
    { name: "18-24", value: 25, color: "#3b82f6" },
    { name: "25-34", value: 35, color: "#8b5cf6" },
    { name: "35-44", value: 25, color: "#06b6d4" },
    { name: "45+", value: 15, color: "#10b981" },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard
          title="Total Reach"
          value={overview.totalReach.toLocaleString()}
          icon={Eye}
          trend={12}
          description="Across all platforms"
        />
        <MetricCard
          title="Total Engagement"
          value={overview.totalEngagement.toLocaleString()}
          icon={Heart}
          trend={8}
          description="Likes, comments, shares"
        />
        <MetricCard
          title="Total Followers"
          value={overview.totalFollowers.toLocaleString()}
          icon={Users}
          trend={5}
          description="Combined followers"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${overview.engagementRate.toFixed(1)}%`}
          icon={TrendingUp}
          trend={-2}
          description="Average across platforms"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Platform Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Comparison</CardTitle>
            <CardDescription>Followers across connected platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                followers: {
                  label: "Followers",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData}>
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="followers" fill="var(--color-followers)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Engagement Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Engagement Trend</CardTitle>
            <CardDescription>Engagement over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                engagement: {
                  label: "Engagement",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementTrend}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke="var(--color-engagement)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-engagement)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Audience Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Audience Demographics</CardTitle>
            <CardDescription>Age distribution of your audience</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                audience: {
                  label: "Audience",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={audienceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {audienceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Key metrics comparison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {platformData.map((platform) => (
              <div key={platform.platform} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">{platform.platform}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{platform.followers.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">followers</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
