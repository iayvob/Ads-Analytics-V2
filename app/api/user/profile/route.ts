import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserService } from "@/lib/user-service"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)

    if (!session?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
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
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)

    if (!session?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { username, email } = body

    const updatedUser = await UserService.updateUser(session.userId, {
      username,
      email,
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}
