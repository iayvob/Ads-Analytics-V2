import { type NextRequest, NextResponse } from "next/server"
import { getSession, setSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"
import { OAuthService } from "@/lib/oauth-service"
import { env } from "@/lib/config"
import { withErrorHandling } from "@/lib/middleware"
import { createUrl, normalizeUrl } from "@/lib/url-utils"

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(createUrl(`?error=twitter_auth_denied`, request.headers))
    }

    if (!code || !state) {
      return NextResponse.redirect(createUrl(`?error=invalid_callback`, request.headers))
    }

    // Verify state
    const session = await getSession(request)
    if (session?.state !== state) {
      return NextResponse.redirect(createUrl(`?error=invalid_state`, request.headers))
    }

    // Exchange code for access token
    const callbackUrl = createUrl(`/api/auth/twitter/callback`, request.headers)
    const tokenData = await OAuthService.exchangeTwitterCode(
      code,
      callbackUrl,
      session.codeVerifier
    )

    // Get user info
    const userData = await OAuthService.getTwitterUserData(tokenData.access_token)

    // Find or create user in database
    let user
    if (session?.userId) {
      // User already exists from previous auth
      user = await UserService.getUserWithProviders(session.userId)
    } else {
      // Check if user exists by provider
      const existingUser = await UserService.findUserByProvider("twitter", userData.id)
      if (existingUser) {
        user = existingUser
      } else {
        // Create new user
        user = await UserService.findOrCreateUserByEmail(`twitter_${userData.id}@temp.local`, {
          username: userData.username,
        })
      }
    }

    // Create or update auth provider
    await UserService.upsertAuthProvider(user!.id, {
      provider: "twitter",
      providerId: userData.id,
      username: userData.username,
      accessToken: tokenData.access_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
    })

    // Update session
    const updatedSession = {
      ...session,
      userId: user!.id,
      twitter: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        userId: userData.id,
        username: userData.username,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
      },
    }

    const response = NextResponse.redirect(createUrl(`?success=twitter`, request.headers))
    await setSession(request, updatedSession, response)

    return response
  } catch (error) {
    console.error("Twitter callback error:", error)
    return NextResponse.redirect(createUrl(`?error=twitter_callback_failed`, request.headers))
  }
})
