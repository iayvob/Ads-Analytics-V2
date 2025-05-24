"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Facebook, Instagram, Twitter, RefreshCw, AlertTriangle, ArrowLeft, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { OverviewMetrics } from "@/components/dashboard/overview-metrics"
import { FacebookInsights } from "@/components/dashboard/facebook-insights"
import { InstagramInsights } from "@/components/dashboard/instagram-insights"
import { TwitterInsights } from "@/components/dashboard/twitter-insights"
import { useDashboardData } from "@/hooks/use-dashboard-data"

export default function Dashboard() {
  const { data, loading, error, refreshData } = useDashboardData()
  const [activeTab, setActiveTab] = useState("overview")
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (data && !loading) {
      // Set active tab to first connected provider if not overview
      if (activeTab === "overview") return

      const connectedPlatforms = data.connectedPlatforms
      if (connectedPlatforms.length > 0 && !connectedPlatforms.includes(activeTab)) {
        setActiveTab(connectedPlatforms[0])
      }
    }
  }, [data, loading, activeTab])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshData()
    } finally {
      setRefreshing(false)
    }
  }

  const handleExportData = () => {
    if (!data) return

    const exportData = {
      ...data,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `social-media-analytics-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid gap-6 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.connectedPlatforms.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Connected Accounts</h3>
            <p className="text-gray-500 mb-4">Connect your social media accounts to view analytics</p>
            <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700">
              Connect Accounts
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="hover:bg-white/50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-lg text-gray-600">Monitor your social media performance</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connected Platforms */}
            <div className="flex items-center gap-2">
              {data.connectedPlatforms.map((platform) => (
                <Badge key={platform} variant="secondary" className="capitalize bg-white/80 backdrop-blur-sm">
                  {platform === "facebook" && <Facebook className="h-3 w-3 mr-1" />}
                  {platform === "instagram" && <Instagram className="h-3 w-3 mr-1" />}
                  {platform === "twitter" && <Twitter className="h-3 w-3 mr-1" />}
                  {platform}
                </Badge>
              ))}
            </div>

            {/* Action Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last Updated */}
        {data.lastUpdated && (
          <div className="text-sm text-gray-500 mb-6">Last updated: {new Date(data.lastUpdated).toLocaleString()}</div>
        )}

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border-white/20">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="facebook"
              disabled={!data.connectedPlatforms.includes("facebook")}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </TabsTrigger>
            <TabsTrigger
              value="instagram"
              disabled={!data.connectedPlatforms.includes("instagram")}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Instagram className="h-4 w-4 mr-2" />
              Instagram
            </TabsTrigger>
            <TabsTrigger
              value="twitter"
              disabled={!data.connectedPlatforms.includes("twitter")}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-700 data-[state=active]:to-black data-[state=active]:text-white"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="overview" className="space-y-6">
                <OverviewMetrics data={data} />
              </TabsContent>

              <TabsContent value="facebook" className="space-y-6">
                <FacebookInsights data={data.facebook} />
              </TabsContent>

              <TabsContent value="instagram" className="space-y-6">
                <InstagramInsights data={data.instagram} />
              </TabsContent>

              <TabsContent value="twitter" className="space-y-6">
                <TwitterInsights data={data.twitter} />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  )
}
