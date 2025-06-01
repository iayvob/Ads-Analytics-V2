import { NextRequest, NextResponse } from "next/server";
import { generateState, generateCodeVerifier, generateCodeChallenge } from "@/lib/auth-utils";
import { getSession, setSession } from "@/lib/session";
import { OAuthService } from "@/lib/oauth-service";
import { env } from "@/lib/config";
import { withRateLimit, withErrorHandling } from "@/lib/middleware";
import { logger } from "@/lib/logger";
import { createUrl } from "@/lib/url-utils";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

async function handler(request: NextRequest): Promise<NextResponse> {
  const state         = generateState();
  const codeVerifier  = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const redirectUri   = createUrl("/api/auth/twitter/callback", request.headers);

  // merge into session
  const existingSession = (await getSession(request)) || { userId: "", createdAt: Date.now() };
  const session      = { ...existingSession, state, codeChallenge, codeVerifier };

  const authUrl = OAuthService.buildTwitterAuthUrl(state, redirectUri, codeChallenge);
  
  logger.info("Twitter auth initiated", { state });

  const response = NextResponse.json({ authUrl });
  await setSession(request, session, response);

  return response;
}

export const POST = withRateLimit(withErrorHandling(handler));