import { type NextRequest, NextResponse } from "next/server"
import { getSession, setSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"
import { withAuth } from "@/lib/middleware"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

async function handler(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request)

  if (session?.facebook) {
    try {
      // Revoke Facebook token
      await fetch(
        `https://graph.facebook.com/${session.facebook.userId}/permissions?access_token=${session.facebook.accessToken}`,
        { method: "DELETE" },
      )
    } catch (error) {
      logger.warn("Failed to revoke Facebook token", { error, userId: session.userId })
    }

    // Remove from database
    await UserService.removeAuthProvider("facebook", session.facebook.userId)

    // Update session
    const updatedSession = { ...session }
    delete updatedSession.facebook

    logger.info("Facebook logout completed", { userId: session.userId })

    const response = NextResponse.json({ success: true })
    await setSession(request, updatedSession, response)
    return response
  }

  return NextResponse.json({ success: true })
}

export const POST = withAuth(handler)
