"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Facebook, Instagram, Twitter, RefreshCw, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { OverviewMetrics } from "@/components/dashboard/overview-metrics"
import { FacebookInsights } from "@/components/dashboard/facebook-insights"
import { InstagramInsights } from "@/components/dashboard/instagram-insights"
import { TwitterInsights } from "@/components/dashboard/twitter-insights"
import { useRouter } from "next/navigation"

interface DashboardData {
  overview: {
    totalReach: number
    totalEngagement: number
    totalFollowers: number
    engagementRate: number
  }
  facebook?: any
  instagram?: any
  twitter?: any
  lastUpdated: string
}

interface AuthStatus {
  facebook: boolean
  instagram: boolean
  twitter: boolean
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    facebook: false,
    instagram: false,
    twitter: false,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check authentication status
      const authResponse = await fetch("/api/auth/status")
      if (!authResponse.ok) {
        throw new Error("Failed to check authentication status")
      }

      const authData = await authResponse.json()
      setAuthStatus(authData.status)

      // Check if user has any connected accounts
      const hasConnectedAccounts = Object.values(authData.status).some(Boolean)
      if (!hasConnectedAccounts) {
        router.push("/")
        return
      }

      // Load dashboard data
      await loadDashboardData()

      // Set active tab to first connected provider
      if (authData.status.facebook) setActiveTab("facebook")
      else if (authData.status.instagram) setActiveTab("instagram")
      else if (authData.status.twitter) setActiveTab("twitter")
    } catch (error) {
      console.error("Failed to load dashboard:", error)
      setError("Failed to load dashboard data")
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/data")
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
      throw error
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      setError(null)

      const response = await fetch("/api/dashboard/refresh", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to refresh data")
      }

      await loadDashboardData()
      toast({
        title: "Success",
        description: "Dashboard data refreshed successfully",
      })
    } catch (error) {
      console.error("Failed to refresh data:", error)
      setError("Failed to refresh data")
      toast({
        title: "Error",
        description: "Failed to refresh dashboard data",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const connectedProviders = Object.entries(authStatus).filter(([_, connected]) => connected)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-lg text-gray-600">Monitor your social media performance across all platforms</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {connectedProviders.map(([provider]) => (
                <Badge key={provider} variant="secondary" className="capitalize">
                  {provider}
                </Badge>
              ))}
            </div>
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Last Updated */}
        {data?.lastUpdated && (
          <div className="text-sm text-gray-500 mb-6">Last updated: {new Date(data.lastUpdated).toLocaleString()}</div>
        )}

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="facebook" disabled={!authStatus.facebook}>
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </TabsTrigger>
            <TabsTrigger value="instagram" disabled={!authStatus.instagram}>
              <Instagram className="h-4 w-4 mr-2" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="twitter" disabled={!authStatus.twitter}>
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewMetrics data={data} authStatus={authStatus} />
          </TabsContent>

          <TabsContent value="facebook" className="space-y-6">
            {authStatus.facebook ? (
              <FacebookInsights data={data?.facebook} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">Facebook account not connected</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="instagram" className="space-y-6">
            {authStatus.instagram ? (
              <InstagramInsights data={data?.instagram} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">Instagram account not connected</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="twitter" className="space-y-6">
            {authStatus.twitter ? (
              <TwitterInsights data={data?.twitter} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">Twitter account not connected</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
