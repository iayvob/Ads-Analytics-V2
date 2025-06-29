import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/user-service"
import { withAuth, withErrorHandling } from "@/lib/middleware"

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export const GET = withAuth(withErrorHandling(async (request: NextRequest) => {
  const stats = await UserService.getUserStats()
  return NextResponse.json(stats)
}))
