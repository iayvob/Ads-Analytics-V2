import { type NextRequest, NextResponse } from "next/server"
import { getSession, clearSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"
import { withAuth } from "@/lib/middleware"
import { logger } from "@/lib/logger"

async function handler(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request)

  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Get all user's auth providers
    const activeProviders = await UserService.getActiveProviders(session.userId)

    // Revoke tokens for each provider
    const revokePromises = activeProviders.map(async (provider) => {
      try {
        switch (provider.provider) {
          case "facebook":
            await fetch(
              `https://graph.facebook.com/${provider.providerId}/permissions?access_token=${provider.accessToken}`,
              { method: "DELETE" },
            )
            break

          case "instagram":
            // Instagram uses Facebook's token system
            await fetch(
              `https://graph.facebook.com/${provider.providerId}/permissions?access_token=${provider.accessToken}`,
              { method: "DELETE" },
            )
            break

          case "twitter":
            await fetch("https://api.twitter.com/2/oauth2/revoke", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64")}`,
              },
              body: new URLSearchParams({
                token: provider.accessToken,
                token_type_hint: "access_token",
              }),
            })
            break
        }

        // Remove provider from database
        await UserService.removeAuthProvider(provider.provider, provider.providerId)
      } catch (error) {
        logger.warn(`Failed to revoke ${provider.provider} token`, {
          error,
          userId: session.userId,
          provider: provider.provider,
        })
      }
    })

    await Promise.all(revokePromises)

    logger.info("User logged out from all providers", {
      userId: session.userId,
      providersCount: activeProviders.length,
    })

    const response = NextResponse.json({ success: true, message: "Logged out successfully" })
    await clearSession(response)

    return response
  } catch (error) {
    logger.error("Failed to logout user", {
      error,
      userId: session.userId,
    })

    return NextResponse.json({ error: "Failed to logout" }, { status: 500 })
  }
}

export const POST = withAuth(handler)
