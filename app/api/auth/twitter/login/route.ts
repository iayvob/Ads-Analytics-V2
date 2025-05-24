import { NextRequest, NextResponse } from "next/server";
import { generateState, generateCodeVerifier, generateCodeChallenge } from "@/lib/auth-utils";
import { getSession, setSession } from "@/lib/session";
import { OAuthService } from "@/lib/oauth-service";
import { env } from "@/lib/config";

export async function POST(request: NextRequest) {
  const state         = generateState();
  const codeVerifier  = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const redirectUri   = `${env.APP_URL}/api/auth/twitter/callback`;

  // merge into session
  const existingSession = (await getSession(request)) || { userId: "", createdAt: Date.now() };
  const session      = { ...existingSession, state, codeChallenge, codeVerifier };

  const authUrl = OAuthService.buildTwitterAuthUrl(state, redirectUri, codeChallenge);

  const response = NextResponse.json({ authUrl });
  await setSession(request, session, response);

  return response;
}