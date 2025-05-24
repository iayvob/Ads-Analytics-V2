import { type NextRequest, NextResponse } from "next/server"
import { getSession, setSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"
import { OAuthService } from "@/lib/oauth-service"
import { withErrorHandling } from "@/lib/middleware"
import { authCallbackSchema } from "@/lib/validation"
import { AuthError } from "@/lib/errors"
import { env } from "@/lib/config"
import { logger } from "@/lib/logger"

async function handler(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const params = {
    code: searchParams.get("code"),
    state: searchParams.get("state"),
    error: searchParams.get("error"),
  }

  // Validate callback parameters
  if (params.error) {
    logger.warn("Facebook auth denied", { error: params.error })
    return NextResponse.redirect(`${env.APP_URL}?error=facebook_auth_denied`)
  }

  const { code, state } = authCallbackSchema.parse(params)

  // Verify state parameter
  const session = await getSession(request)
  if (session?.state !== state) {
    logger.warn("Invalid state parameter", { sessionState: session?.state, callbackState: state })
    throw new AuthError("Invalid authentication state")
  }

  const redirectUri = `${env.APP_URL}/api/auth/facebook/callback`

  // Exchange code for tokens
  const tokenData = await OAuthService.exchangeFacebookCode(code, redirectUri)

  // Get user data
  const userData = await OAuthService.getFacebookUserData(tokenData.access_token)

  // Get business data
  const businessData = await OAuthService.getFacebookBusinessData(tokenData.access_token)

  // Find or create user
  let user
  if (userData.email) {
    user = await UserService.findOrCreateUserByEmail(userData.email, {
      username: userData.name,
    })
  } else {
    const existingUser = await UserService.findUserByProvider("facebook", userData.id)
    if (existingUser) {
      user = existingUser
    } else {
      user = await UserService.findOrCreateUserByEmail(`facebook_${userData.id}@temp.local`, {
        username: userData.name,
      })
    }
  }

  // Save auth provider data
  await UserService.upsertAuthProvider(user.id, {
    provider: "facebook",
    providerId: userData.id,
    username: userData.name,
    email: userData.email,
    accessToken: tokenData.access_token,
    expiresAt: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000),
    advertisingAccountId: businessData.primaryAdAccountId,
    businessAccounts: businessData.businesses,
    adAccounts: businessData.adAccounts,
    configId: env.FACEBOOK_BUSINESS_CONFIG_ID,
  })

  // Update session
  const updatedSession = {
    ...session,
    userId: user.id,
    facebook: {
      accessToken: tokenData.access_token,
      userId: userData.id,
      name: userData.name,
      email: userData.email,
      businesses: businessData.businesses,
      adAccounts: businessData.adAccounts,
      expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
      configId: env.FACEBOOK_BUSINESS_CONFIG_ID,
    },
  }

  logger.info("Facebook auth completed", { userId: user.id, providerId: userData.id })

  const response = NextResponse.redirect(`${env.APP_URL}?success=facebook`)
  await setSession(request, updatedSession, response)

  return response
}

export const GET = withErrorHandling(handler)
