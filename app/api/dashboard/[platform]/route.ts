import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { DashboardService } from "@/lib/dashboard-service"
import { withAuth } from "@/lib/middleware"
import { logger } from "@/lib/logger"

interface RouteParams {
  params: {
    platform: "facebook" | "instagram" | "twitter"
  }
}

async function handler(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request)

  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const platform = request.nextUrl.pathname.split('/').pop() as "facebook" | "instagram" | "twitter"

  if (!["facebook", "instagram", "twitter"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
  }

  try {
    const platformData = await DashboardService.getPlatformData(session.userId, platform)
    return NextResponse.json({
      ...platformData,
      lastUpdated: new Date().toISOString(),
      dataSource: "api",
    })
  } catch (error) {
    logger.error(`Failed to fetch ${platform} data`, {
      error,
      userId: session.userId,
      platform,
    })

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes("not connected")) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes("expired")) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
    }

    return NextResponse.json({ error: `Failed to fetch ${platform} data` }, { status: 500 })
  }
}

export const GET = withAuth(handler)
