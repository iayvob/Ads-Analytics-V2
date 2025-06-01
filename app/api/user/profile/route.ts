import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"
import { withAuth } from "@/lib/middleware"

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export const GET = withAuth(async (request: NextRequest) => {
  const session = await getSession(request)
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 401 })
  }
  
  const user = await UserService.getUserWithProviders(session.userId)

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      authProviders: user.authProviders.map((provider) => ({
        provider: provider.provider,
        username: provider.username,
        email: provider.email,
        advertisingAccountId: provider.advertisingAccountId,
        createdAt: provider.createdAt,
        expiresAt: provider.expiresAt,
      })),
    },
  })
})

export const PUT = withAuth(async (request: NextRequest) => {
  const session = await getSession(request)
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 401 })
  }
  
  const body = await request.json()
  const { username, email } = body

  const updatedUser = await UserService.updateUser(session.userId, {
    username,
    email,
  })

  return NextResponse.json({ user: updatedUser })
})
