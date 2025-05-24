import { type NextRequest, NextResponse } from "next/server"
import { getSession, setSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(`${process.env.APP_URL}?error=twitter_auth_denied`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.APP_URL}?error=invalid_callback`)
    }

    // Verify state
    const session = await getSession(request)
    if (session?.state !== state) {
      return NextResponse.redirect(`${process.env.APP_URL}?error=invalid_state`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.APP_URL}/api/auth/twitter/callback`,
        code_verifier: session.codeVerifier!,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token")
    }

    const tokenData = await tokenResponse.json()

    // Get user info
    const userResponse = await fetch("https://api.twitter.com/2/users/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })
    const userData = await userResponse.json()

    // Find or create user in database
    let user
    if (session?.userId) {
      // User already exists from previous auth
      user = await UserService.getUserWithProviders(session.userId)
    } else {
      // Check if user exists by provider
      const existingUser = await UserService.findUserByProvider("twitter", userData.data.id)
      if (existingUser) {
        user = existingUser
      } else {
        // Create new user
        user = await UserService.findOrCreateUserByEmail(`twitter_${userData.data.id}@temp.local`, {
          username: userData.data.username,
        })
      }
    }

    // Create or update auth provider
    await UserService.upsertAuthProvider(user!.id, {
      provider: "twitter",
      providerId: userData.data.id,
      username: userData.data.username,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
    })

    // Update session
    const updatedSession = {
      ...session,
      userId: user!.id,
      twitter: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        userId: userData.data.id,
        username: userData.data.username,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
      },
    }

    const response = NextResponse.redirect(`${process.env.APP_URL}?success=twitter`)
    await setSession(request, updatedSession, response)

    return response
  } catch (error) {
    console.error("Twitter callback error:", error)
    return NextResponse.redirect(`${process.env.APP_URL}?error=twitter_callback_failed`)
  }
}
