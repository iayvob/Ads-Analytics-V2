import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/user-service"

export async function GET(request: NextRequest) {
  try {
    const stats = await UserService.getUserStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
