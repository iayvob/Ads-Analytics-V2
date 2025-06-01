import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"
import { withErrorHandling } from "@/lib/middleware"

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const session = await getSession(request)

    if (!session?.userId) {
      return NextResponse.json({
        status: { facebook: false, instagram: false, twitter: false },
        session: {},
        user: null,
      })
    }

    // Get user with all auth providers from database
    const userWithProviders = await UserService.getUserWithProviders(session.userId)

    if (!userWithProviders) {
      return NextResponse.json({
        status: { facebook: false, instagram: false, twitter: false },
        session: {},
        user: null,
      })
    }

    // Check active providers
    const activeProviders = await UserService.getActiveProviders(session.userId)

    const status = {
      facebook: activeProviders.some((p) => p.provider === "facebook"),
      instagram: activeProviders.some((p) => p.provider === "instagram"),
      twitter: activeProviders.some((p) => p.provider === "twitter"),
    }

    // Build session data from database
    const sessionData: any = {}

    activeProviders.forEach((provider) => {
      if (provider.provider === "facebook") {
        sessionData.facebook = {
          accessToken: provider.accessToken,
          userId: provider.providerId,
          name: provider.username,
          email: provider.email,
          businesses: provider.businessAccounts || [],
          adAccounts: provider.adAccounts || [],
          expiresAt: provider.expiresAt?.getTime() || Date.now() + 3600000,
          configId: provider.configId,
        }
      } else if (provider.provider === "instagram") {
        sessionData.instagram = {
          accessToken: provider.accessToken,
          userId: provider.providerId,
          username: provider.username,
          expiresAt: provider.expiresAt?.getTime() || Date.now() + 3600000,
        }
      } else if (provider.provider === "twitter") {
        sessionData.twitter = {
          accessToken: provider.accessToken,
          refreshToken: provider.refreshToken,
          userId: provider.providerId,
          username: provider.username,
          expiresAt: provider.expiresAt?.getTime() || Date.now() + 3600000,
        }
      }
    })

    return NextResponse.json({
      status,
      session: sessionData,
      user: {
        id: userWithProviders.id,
        email: userWithProviders.email,
        username: userWithProviders.username,
        createdAt: userWithProviders.createdAt,
        authProviders: activeProviders.length,
      },
    })
  } catch (error) {
    console.error("Error checking auth status:", error)
    return NextResponse.json({ error: "Failed to check authentication status" }, { status: 500 })
  }
})
