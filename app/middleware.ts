// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRateLimit } from "@/lib/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Bypass OAuth callback entirely
  if (pathname === "/api/auth/") {
    return NextResponse.next();
  }

  // 3) Protect private APIs
  if (pathname.startsWith("/api/private")) {
    // Example: apply rate limit first, then auth
    return withRateLimit(withAuth(async () => NextResponse.next()))(request);
  }

  // 4) Let everything else flow
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/private/:path*",
    "/dashboard/:path*",
  ],
};
