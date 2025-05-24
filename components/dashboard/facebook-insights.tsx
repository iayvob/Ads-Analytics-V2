"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "./metric-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Users, Eye, Heart, DollarSign } from "lucide-react"

interface FacebookInsightsProps {
  data?: any
}

export function FacebookInsights({ data }: FacebookInsightsProps) {
  const pageData = data?.pageData || {}
  const insights = data?.insights || {}
  const adData = data?.adData || {}

  // Sample data for demonstration
  const dailyMetrics = [
    { date: "Jan 1", reach: 1200, engagement: 150, impressions: 2400 },
    { date: "Jan 2", reach: 1350, engagement: 180, impressions: 2700 },
    { date: "Jan 3", reach: 1100, engagement: 140, impressions: 2200 },
    { date: "Jan 4", reach: 1450, engagement: 200, impressions: 2900 },
    { date: "Jan 5", reach: 1600, engagement: 220, impressions: 3200 },
    { date: "Jan 6", reach: 1800, engagement: 250, impressions: 3600 },
    { date: "Jan 7", reach: 1700, engagement: 230, impressions: 3400 },
  ]

  const audienceData = [
    { name: "18-24", value: 28, color: "#1877f2" },
    { name: "25-34", value: 35, color: "#42a5f5" },
    { name: "35-44", value: 22, color: "#64b5f6" },
    { name: "45-54", value: 10, color: "#90caf9" },
    { name: "55+", value: 5, color: "#bbdefb" },
  ]

  const campaignData = [
    { name: "Brand Awareness", spend: 1200, reach: 45000, ctr: 2.3 },
    { name: "Lead Generation", spend: 800, reach: 28000, ctr: 3.1 },
    { name: "Website Traffic", spend: 600, reach: 22000, ctr: 1.8 },
    { name: "Engagement", spend: 400, reach: 18000, ctr: 4.2 },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard
          title="Page Likes"
          value={pageData.fan_count?.toLocaleString() || "0"}
          icon={Users}
          trend={5}
          description="Total page followers"
        />
        <MetricCard
          title="Page Reach"
          value={insights.reach?.toLocaleString() || "0"}
          icon={Eye}
          trend={12}
          description="Last 7 days"
        />
        <MetricCard
          title="Engagement"
          value={insights.engagement?.toLocaleString() || "0"}
          icon={Heart}
          trend={8}
          description="Likes, comments, shares"
        />
        <MetricCard
          title="Ad Spend"
          value={`$${adData.spend?.toLocaleString() || "0"}`}
          icon={DollarSign}
          trend={-3}
          description="This month"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Performance */}
        <Card>
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

        {/* Audience Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Audience Age Distribution</CardTitle>
            <CardDescription>Age breakdown of your Facebook audience</CardDescription>
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

        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Ad spend and reach by campaign type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                spend: {
                  label: "Spend ($)",
                  color: "hsl(var(--chart-3))",
                },
                reach: {
                  label: "Reach",
                  color: "hsl(var(--chart-4))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="spend" fill="var(--color-spend)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
            <CardDescription>Your best content this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { content: "New product launch announcement", engagement: 245, reach: 3200 },
              { content: "Behind the scenes video", engagement: 189, reach: 2800 },
              { content: "Customer testimonial", engagement: 156, reach: 2100 },
              { content: "Industry insights article", engagement: 134, reach: 1900 },
            ].map((post, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{post.content}</p>
                  <p className="text-xs text-gray-500">Reach: {post.reach.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">{post.engagement}</div>
                  <div className="text-xs text-gray-500">engagements</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
