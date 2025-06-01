// filepath: d:\freelance\adinsights_frontend\app\api\admin\stats\route.ts
import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/user-service"
import { withAuth, withErrorHandling } from "@/lib/middleware"

export const GET = withAuth(withErrorHandling(async (request: NextRequest) => {
  const stats = await UserService.getUserStats()
  return NextResponse.json(stats)
}))
