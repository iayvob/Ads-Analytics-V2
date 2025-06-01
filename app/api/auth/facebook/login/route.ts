import { type NextRequest, NextResponse } from "next/server"
import { generateState } from "@/lib/auth-utils"
import { getSession, setSession } from "@/lib/session"
import { OAuthService } from "@/lib/oauth-service"
import { withRateLimit, withErrorHandling } from "@/lib/middleware"
import { env } from "@/lib/config"
import { logger } from "@/lib/logger"
import { createUrl } from "@/lib/url-utils"

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

async function handler(request: NextRequest): Promise<NextResponse> {
  const state = generateState()
  const redirectUri = createUrl("/api/auth/facebook/callback", request.headers)

  // Get existing session or create new one
  const existingSession = (await getSession(request)) || { userId: "", createdAt: Date.now() }
  const session = { ...existingSession, state }

  const authUrl = OAuthService.buildFacebookAuthUrl(state, redirectUri)

  logger.info("Facebook auth initiated", { state })

  const response = NextResponse.json({ authUrl })
  await setSession(request, session, response)

  return response
}

export const POST = withRateLimit(withErrorHandling(handler))
