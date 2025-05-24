import { type NextRequest, NextResponse } from "next/server"
import { getSession, setSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)

    if (session?.instagram) {
      // Remove Instagram data from session
      const updatedSession = { ...session }
      delete updatedSession.instagram

      const response = NextResponse.json({ success: true })
      await setSession(request, updatedSession, response)
      return response
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Instagram logout error:", error)
    return NextResponse.json({ error: "Failed to logout from Instagram" }, { status: 500 })
  }
}
