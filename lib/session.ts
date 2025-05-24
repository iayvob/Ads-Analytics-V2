import { type NextRequest, NextResponse } from "next/server"
import { SignJWT, jwtVerify } from "jose"
import { env, APP_CONFIG } from "./config"
import { AuthError } from "./errors"
import { logger } from "./logger"
import type { AuthSession } from "./types"

const encodedKey = new TextEncoder().encode(env.SESSION_SECRET)

export async function encrypt(payload: AuthSession): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + APP_CONFIG.SESSION_DURATION))
    .sign(encodedKey)
}

export async function decrypt(session: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload as AuthSession
  } catch (error) {
    logger.warn("Failed to decrypt session", { error: error instanceof Error ? error.message : "Unknown error" })
    return null
  }
}

export async function getSession(request: NextRequest): Promise<AuthSession | null> {
  const sessionCookie = request.cookies.get("session")?.value
  if (!sessionCookie) return null

  const session = await decrypt(sessionCookie)

  // Validate session age
  if (session && Date.now() - session.createdAt > APP_CONFIG.SESSION_DURATION) {
    logger.info("Session expired", { userId: session.userId })
    return null
  }

  return session
}

export async function setSession(
  request: NextRequest,
  sessionData: AuthSession,
  response?: NextResponse,
): Promise<NextResponse> {
  const session = await encrypt({
    ...sessionData,
    createdAt: sessionData.createdAt || Date.now(),
  })

  const responseToUse = response || NextResponse.json({ success: true })

  responseToUse.cookies.set("session", session, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: APP_CONFIG.SESSION_DURATION / 1000,
    path: "/",
  })

  return responseToUse
}

export async function clearSession(response: NextResponse): Promise<void> {
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
}

export async function requireAuth(request: NextRequest): Promise<AuthSession> {
  const session = await getSession(request)
  if (!session?.userId) {
    throw new AuthError("Authentication required")
  }
  return session
}
