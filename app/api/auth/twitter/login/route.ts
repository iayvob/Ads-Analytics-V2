import { type NextRequest, NextResponse } from "next/server"
import { generateState, generateCodeChallenge } from "@/lib/auth-utils"
import { getSession, setSession } from "@/lib/session"
import { OAuthService } from "@/lib/oauth-service"
import { withRateLimit, withErrorHandling } from "@/lib/middleware"
import { env } from "@/lib/config"
import { logger } from "@/lib/logger"

async function handler(request: NextRequest): Promise<NextResponse> {
  const state = generateState()
  const codeVerifier = generateState() // Use generateState to create a random verifier
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`

  // Get existing session or create new one
  const existingSession = (await getSession(request)) || { userId: "", createdAt: Date.now() }
  const session = { ...existingSession, state, codeChallenge }

  const authUrl = OAuthService.buildTwitterAuthUrl(state, redirectUri, codeChallenge)

  logger.info("Twitter auth initiated", { state })

  const response = NextResponse.json({ authUrl })
  await setSession(request, session, response)

  return response
}

export const POST = withRateLimit(withErrorHandling(handler))
