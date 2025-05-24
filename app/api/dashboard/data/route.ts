import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { DashboardService } from "@/lib/dashboard-service"
import { withAuth } from "@/lib/middleware"
import { logger } from "@/lib/logger"

async function handler(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request)

  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const dashboardData = await DashboardService.getDashboardData(session.userId)

    logger.info("Dashboard data fetched successfully", {
      userId: session.userId,
      platforms: dashboardData.connectedPlatforms,
      totalFollowers: dashboardData.overview.totalFollowers,
    })

    return NextResponse.json(dashboardData)
  } catch (error) {
    logger.error("Failed to fetch dashboard data", {
      error,
      userId: session.userId,
    })

    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}

export const GET = withAuth(handler)
