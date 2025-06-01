import { type NextRequest, NextResponse } from "next/server"
import { getSession, setSession } from "@/lib/session"
import { env } from "@/lib/config"

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)

    if (session?.twitter) {
      // Revoke Twitter token
      await fetch("https://api.twitter.com/2/oauth2/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${env.TWITTER_CLIENT_ID}:${env.TWITTER_CLIENT_SECRET}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          token: session.twitter.accessToken,
          token_type_hint: "access_token",
        }),
      })

      // Remove Twitter data from session
      const updatedSession = { ...session }
      delete updatedSession.twitter

      const response = NextResponse.json({ success: true })
      await setSession(request, updatedSession, response)
      return response
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Twitter logout error:", error)
    return NextResponse.json({ error: "Failed to logout from Twitter" }, { status: 500 })
  }
}
