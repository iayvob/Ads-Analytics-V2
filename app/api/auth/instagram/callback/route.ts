import { type NextRequest, NextResponse } from "next/server"
import { getSession, setSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"
import { OAuthService } from "@/lib/oauth-service"
import { env } from "@/lib/config"
import { withErrorHandling } from "@/lib/middleware"

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(`${env.APP_URL}?error=instagram_auth_denied`)
    }

    if (!code) {
      return NextResponse.redirect(`${env.APP_URL}?error=invalid_callback`)
    }

    // Verify state
    const session = await getSession(request)

    // Exchange code for access token
    const tokenData = await OAuthService.exchangeInstagramCode(code, `${env.APP_URL}/api/auth/instagram/callback`)

    // Get user info
    const userData = await OAuthService.getInstagramUserData(tokenData.access_token)

    // Find or create user in database
    let user
    if (session?.userId) {
      // User already exists from previous auth
      user = await UserService.getUserWithProviders(session.userId)
    } else {
      // Check if user exists by provider
      const existingUser = await UserService.findUserByProvider("instagram", userData.id)
      if (existingUser) {
        user = existingUser
      } else {
        // Create new user
        user = await UserService.findOrCreateUserByEmail(`instagram_${userData.id}@temp.local`, {
          username: userData.username,
        })
      }
    }

    // Create or update auth provider
    await UserService.upsertAuthProvider(user!.id, {
      provider: "instagram",
      providerId: userData.id,
      username: userData.username,
      accessToken: tokenData.access_token,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    })

    // Update session
    const updatedSession = {
      ...session,
      userId: user!.id,
      createdAt: Date.now(),
      instagram: {
        accessToken: tokenData.access_token,
        userId: userData.id,
        username: userData.username,
        expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
      },
    }

    const response = NextResponse.redirect(`${env.APP_URL}?success=instagram`)
    await setSession(request, updatedSession, response)

    return response
  } catch (error) {
    console.error("Instagram callback error:", error)
    return NextResponse.redirect(`${env.APP_URL}?error=instagram_callback_failed`)
  }
})