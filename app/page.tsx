"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Facebook,
  Instagram,
  Twitter,
  CheckCircle,
  AlertCircle,
  LogOut,
  Sparkles,
  Shield,
  BarChart3,
  Users,
  TrendingUp,
  Zap,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
}

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    y: -5,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
}

export default function Dashboard() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    facebook: false,
    instagram: false,
    twitter: false,
  })
  const [userSession, setUserSession] = useState<UserSession>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [hasConnectedAccounts, setHasConnectedAccounts] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    const connected = Object.values(authStatus).some(Boolean)
    setHasConnectedAccounts(connected)

    if (connected && !isInitialLoad) {
      // Redirect to dashboard after successful authentication
      // setTimeout(() => {
      //   router.push("/dashboard")
      // }, 1500)
    }
  }, [authStatus, isInitialLoad, router])

  const checkAuthStatus = async () => {
    try {
      setIsInitialLoad(true)
      const response = await fetch("/api/auth/status")
      if (response.ok) {
        const data = await response.json()
        setAuthStatus(data.status)
        setUserSession(data.session)

        // If user has connected accounts, redirect to dashboard
        const hasAccounts = Object.values(data.status).some(Boolean)
        if (hasAccounts) {
          // router.push("/dashboard")
        }
      }
    } catch (error) {
      console.error("Failed to check auth status:", error)
    } finally {
      setIsInitialLoad(false)
    }
  }

  const handleAuth = async (platform: "facebook" | "instagram" | "twitter") => {
    setLoading(platform)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const response = await fetch(`/api/auth/${platform}/login`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setProgress(100)

        // Add a small delay for better UX
        setTimeout(() => {
          window.location.href = data.authUrl
        }, 500)
      } else {
        throw new Error("Failed to initiate authentication")
      }
    } catch (error) {
      clearInterval(progressInterval)
      setProgress(0)
      toast({
        title: "Authentication Error",
        description: `Failed to authenticate with ${platform}`,
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setLoading(null)
        setProgress(0)
      }, 1000)
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

  const platformConfigs = [
    {
      id: "facebook",
      name: "Facebook Business",
      description: "Access Facebook Business Manager and Ads APIs",
      icon: Facebook,
      color: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
      accentColor: "text-blue-600",
      gradientFrom: "from-blue-500",
      gradientTo: "to-blue-600",
    },
    {
      id: "instagram",
      name: "Instagram Business",
      description: "Access Instagram Business and Creator APIs",
      icon: Instagram,
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      hoverColor: "hover:from-purple-600 hover:to-pink-600",
      accentColor: "text-pink-600",
      gradientFrom: "from-purple-500",
      gradientTo: "to-pink-500",
    },
    {
      id: "twitter",
      name: "X Ads API",
      description: "Access X Ads API for advertising campaigns",
      icon: Twitter,
      color: "bg-black",
      hoverColor: "hover:bg-gray-800",
      accentColor: "text-black",
      gradientFrom: "from-gray-800",
      gradientTo: "to-black",
    },
  ]

  if (isInitialLoad) {
    return (
      <div className="min-h-screen mt-[13rem] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading your dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute top-3/4 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
        />
      </div>

      <div className="relative z-10 p-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <motion.div variants={pulseVariants} animate="pulse" className="inline-flex items-center gap-2 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
              Social Media Analytics Hub
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Connect your business accounts and unlock powerful insights with our comprehensive analytics platform
            </p>
          </motion.div>

          {/* Success Message */}
          <AnimatePresence>
            {hasConnectedAccounts && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8"
              >
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Authentication successful! Redirecting to your dashboard...
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Features Grid */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level encryption and OAuth 2.0 authentication",
              },
              {
                icon: BarChart3,
                title: "Real-time Analytics",
                description: "Live data visualization and performance tracking",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Optimized for speed with instant data updates",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Authentication Cards */}
          <motion.div variants={itemVariants} className="grid gap-8 md:grid-cols-3 mb-12">
            {platformConfigs.map((platform) => {
              const isConnected = authStatus[platform.id as keyof AuthStatus]
              const sessionData = userSession[platform.id as keyof UserSession]
              const isLoading = loading === platform.id

              return (
                <motion.div key={platform.id} variants={cardHoverVariants} whileHover="hover" className="relative">
                  <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    {/* Gradient Background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${platform.gradientFrom} ${platform.gradientTo} opacity-5`}
                    />

                    <CardHeader className="relative pb-3">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-3 bg-gradient-to-r ${platform.gradientFrom} ${platform.gradientTo} rounded-xl`}
                          >
                            <platform.icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold">{platform.name}</CardTitle>
                          </div>
                        </div>
                        <AnimatePresence mode="wait">
                          {isConnected ? (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                            </motion.div>
                          ) : (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <Badge variant="secondary" className="border-gray-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Not Connected
                              </Badge>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <CardDescription className="text-gray-600">{platform.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="relative space-y-4">
                      {/* Loading Progress */}
                      <AnimatePresence>
                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Connecting...</span>
                              <span className="text-gray-600">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Connected State */}
                      <AnimatePresence mode="wait">
                        {isConnected && sessionData ? (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                          >
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                              {platform.id === "facebook" && "name" in sessionData && sessionData.name && (
                                <>
                                  <p className="font-medium text-green-800">Account: {sessionData.name}</p>
                                  {sessionData.email && (
                                    <p className="text-sm text-green-600">Email: {sessionData.email}</p>
                                  )}
                                  {sessionData.businesses && sessionData.businesses.length > 0 && (
                                    <div className="text-sm text-green-600 mt-2">
                                      <p>Businesses: {sessionData.businesses.length}</p>
                                      <p>Ad Accounts: {sessionData.adAccounts?.length || 0}</p>
                                    </div>
                                  )}
                                </>
                              )}
                              {platform.id === "instagram" && "username" in sessionData && (
                                <p className="font-medium text-green-800">@{sessionData.username}</p>
                              )}
                              {platform.id === "twitter" && "username" in sessionData && (
                                <p className="font-medium text-green-800">@{sessionData.username}</p>
                              )}
                              <p className="text-xs text-green-600 mt-1">
                                Expires: {formatExpiryDate(sessionData.expiresAt)}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLogout(platform.id as any)}
                              className="w-full border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Disconnect
                            </Button>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            <Button
                              onClick={() => handleAuth(platform.id as any)}
                              disabled={isLoading}
                              className={`w-full ${platform.color} ${platform.hoverColor} text-white font-medium py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100`}
                            >
                              {isLoading ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                />
                              ) : (
                                <platform.icon className="h-5 w-5 mr-2" />
                              )}
                              {isLoading ? "Connecting..." : `Connect ${platform.name.split(" ")[0]}`}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          <Separator className="my-12 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          {/* Platform Overview */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Platform Capabilities
                </CardTitle>
                <CardDescription>Overview of features available with each connected platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {platformConfigs.map((platform) => (
                    <motion.div
                      key={platform.id}
                      whileHover={{ scale: 1.02 }}
                      className="text-center p-6 border rounded-xl bg-gradient-to-br from-white to-gray-50"
                    >
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${platform.gradientFrom} ${platform.gradientTo} rounded-2xl mb-4`}
                      >
                        <platform.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-semibold mb-2">{platform.name.split(" ")[0]} Analytics</h3>
                      <p className="text-sm text-gray-600">
                        {authStatus[platform.id as keyof AuthStatus]
                          ? "Full analytics access enabled"
                          : "Connect to unlock insights"}
                      </p>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        {authStatus[platform.id as keyof AuthStatus] ? (
                          <>
                            <Users className="h-4 w-4 text-green-500" />
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <BarChart3 className="h-4 w-4 text-green-500" />
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4 text-gray-300" />
                            <TrendingUp className="h-4 w-4 text-gray-300" />
                            <BarChart3 className="h-4 w-4 text-gray-300" />
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Call to Action */}
          <motion.div variants={itemVariants} className="text-center mt-12">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => router.push("/dashboard")}
                disabled={!hasConnectedAccounts}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                {hasConnectedAccounts ? "View Dashboard" : "Connect an Account to Continue"}
              </Button>
            </motion.div>
            {!hasConnectedAccounts && (
              <p className="text-sm text-gray-500 mt-2">
                Connect at least one platform to access your analytics dashboard
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}