import { type NextRequest, NextResponse } from "next/server"
import { getSession, setSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"
import { OAuthService } from "@/lib/oauth-service"
import { AuthError } from "@/lib/errors"
import { env } from "@/lib/config"
import { logger } from "@/lib/logger"
import { withErrorHandling } from "@/lib/middleware"
import { createUrl } from "@/lib/url-utils"

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const params = {
    code: searchParams.get("code"),
    state: searchParams.get("state"),
    error: searchParams.get("error"),
  }

  // Validate callback parameters
  if (params.error) {
    logger.warn("Facebook auth denied", { error: params.error })
    return NextResponse.redirect(createUrl(`?error=facebook_auth_denied`, request.headers))
  }

  // Remove Facebook hash if present
  const redirectUrl = createUrl(`?success=facebook`, request.headers).replace(/#_=_$/, '')

  // Verify required parameters
  if (!params.code || !params.state) {
    logger.warn("Missing required parameters", { params })
    return NextResponse.redirect(createUrl(`?error=missing_params`, request.headers))
  }

  const { code, state } = params

  // Verify state parameter
  const session = await getSession(request)
  if (session?.state !== state) {
    logger.warn("Invalid state parameter", { sessionState: session?.state, callbackState: state })
    throw new AuthError("Invalid authentication state")
  }

  const redirectUri = createUrl("/api/auth/facebook/callback", request.headers)

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
          expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
          configId: env.FACEBOOK_BUSINESS_CONFIG_ID,
        },
        createdAt: session?.createdAt || Date.now()
      }
  
    logger.info("Facebook auth completed", { userId: user.id, providerId: userData.id })
  
    const response = NextResponse.redirect(redirectUrl)
    await setSession(request, updatedSession, response)
  
    return response
  })
