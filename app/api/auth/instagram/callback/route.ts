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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=instagram_auth_denied`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=invalid_callback`)
    }

    // Verify state
    const session = await getSession(request)
    if (session?.state !== state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=invalid_state`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID!,
        client_secret: process.env.INSTAGRAM_APP_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token")
    }

    const tokenData = await tokenResponse.json()

    // Get user info
    const userResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${tokenData.access_token}`,
    )
    const userData = await userResponse.json()

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
      instagram: {
        accessToken: tokenData.access_token,
        userId: userData.id,
        username: userData.username,
        expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
      },
    }

    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?success=instagram`)
    await setSession(request, updatedSession, response)

    return response
  } catch (error) {
    console.error("Instagram callback error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=instagram_callback_failed`)
  }
}
