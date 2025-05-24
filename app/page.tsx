"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Facebook, Instagram, Twitter, CheckCircle, AlertCircle, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AuthStatus {
  facebook: boolean
  instagram: boolean
  twitter: boolean
}

interface UserSession {
  facebook?: {
    accessToken: string
    userId: string
    name: string
    expiresAt: number
    email?: string
    businesses?: any[]
    adAccounts?: any[]
  }
  instagram?: {
    accessToken: string
    userId: string
    username: string
    expiresAt: number
  }
  twitter?: {
    accessToken: string
    userId: string
    username: string
    expiresAt: number
  }
}

export default function Dashboard() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    facebook: false,
    instagram: false,
    twitter: false,
  })
  const [userSession, setUserSession] = useState<UserSession>({})
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/status")
      if (response.ok) {
        const data = await response.json()
        setAuthStatus(data.status)
        setUserSession(data.session)
      }
    } catch (error) {
      console.error("Failed to check auth status:", error)
    }
  }

  const handleAuth = async (platform: "facebook" | "instagram" | "twitter") => {
    setLoading(platform)
    try {
      const response = await fetch(`/api/auth/${platform}/login`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authUrl
      } else {
        throw new Error("Failed to initiate authentication")
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: `Failed to authenticate with ${platform}`,
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleLogout = async (platform: "facebook" | "instagram" | "twitter") => {
    try {
      const response = await fetch(`/api/auth/${platform}/logout`, {
        method: "POST",
      })

      if (response.ok) {
        await checkAuthStatus()
        toast({
          title: "Logged Out",
          description: `Successfully logged out from ${platform}`,
        })
      }
    } catch (error) {
      toast({
        title: "Logout Error",
        description: `Failed to logout from ${platform}`,
        variant: "destructive",
      })
    }
  }

  const formatExpiryDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Social Media Business Authentication</h1>
          <p className="text-lg text-gray-600">Connect your business accounts to access advertising APIs</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Facebook Business */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Facebook className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-lg">Facebook Business</CardTitle>
                </div>
                {authStatus.facebook ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>
              <CardDescription>Access Facebook Business Manager and Ads APIs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authStatus.facebook && userSession.facebook ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Account: {userSession.facebook.name}</p>
                  {userSession.facebook.email && (
                    <p className="text-xs text-gray-500">Email: {userSession.facebook.email}</p>
                  )}
                  {userSession.facebook.businesses && userSession.facebook.businesses.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <p>Businesses: {userSession.facebook.businesses.length}</p>
                      <p>Ad Accounts: {userSession.facebook.adAccounts?.length || 0}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Expires: {formatExpiryDate(userSession.facebook.expiresAt)}</p>
                  <Button variant="outline" size="sm" onClick={() => handleLogout("facebook")} className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleAuth("facebook")}
                  disabled={loading === "facebook"}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading === "facebook" ? "Connecting..." : "Connect Facebook Business"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Instagram Business */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Instagram className="h-6 w-6 text-pink-600" />
                  <CardTitle className="text-lg">Instagram Business</CardTitle>
                </div>
                {authStatus.instagram ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>
              <CardDescription>Access Instagram Business and Creator APIs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authStatus.instagram && userSession.instagram ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">@{userSession.instagram.username}</p>
                  <p className="text-xs text-gray-500">Expires: {formatExpiryDate(userSession.instagram.expiresAt)}</p>
                  <Button variant="outline" size="sm" onClick={() => handleLogout("instagram")} className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleAuth("instagram")}
                  disabled={loading === "instagram"}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {loading === "instagram" ? "Connecting..." : "Connect Instagram"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* X (Twitter) Ads */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Twitter className="h-6 w-6 text-black" />
                  <CardTitle className="text-lg">X Ads API</CardTitle>
                </div>
                {authStatus.twitter ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>
              <CardDescription>Access X Ads API for advertising campaigns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authStatus.twitter && userSession.twitter ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">@{userSession.twitter.username}</p>
                  <p className="text-xs text-gray-500">Expires: {formatExpiryDate(userSession.twitter.expiresAt)}</p>
                  <Button variant="outline" size="sm" onClick={() => handleLogout("twitter")} className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleAuth("twitter")}
                  disabled={loading === "twitter"}
                  className="w-full bg-black hover:bg-gray-800"
                >
                  {loading === "twitter" ? "Connecting..." : "Connect X Ads"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <Card>
          <CardHeader>
            <CardTitle>API Access Status</CardTitle>
            <CardDescription>Overview of your connected business accounts and their capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <Facebook className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">Facebook Ads</h3>
                <p className="text-sm text-gray-500">
                  {authStatus.facebook ? "Campaign management enabled" : "Not connected"}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Instagram className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                <h3 className="font-semibold">Instagram Business</h3>
                <p className="text-sm text-gray-500">
                  {authStatus.instagram ? "Content & insights access" : "Not connected"}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Twitter className="h-8 w-8 text-black mx-auto mb-2" />
                <h3 className="font-semibold">X Advertising</h3>
                <p className="text-sm text-gray-500">
                  {authStatus.twitter ? "Ads API access enabled" : "Not connected"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
