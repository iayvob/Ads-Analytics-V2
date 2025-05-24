import { type NextRequest, NextResponse } from "next/server"
import { rateLimiter } from "./rate-limiter"
import { handleApiError, RateLimitError } from "./errors"
import { logger } from "./logger"

export function withRateLimit(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const identifier = request.ip || request.headers.get("x-forwarded-for") || "unknown"

      if (rateLimiter.isRateLimited(identifier)) {
        logger.warn("Rate limit exceeded", { identifier, url: request.url })
        throw new RateLimitError()
      }

      return await handler(request)
    } catch (error) {
      const { error: errorMessage, statusCode } = handleApiError(error)
      return NextResponse.json({ error: errorMessage }, { status: statusCode })
    }
  }
}

export function withErrorHandling(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request)
    } catch (error) {
      const { error: errorMessage, statusCode } = handleApiError(error)
      logger.error("API error", { error, url: request.url, method: request.method })
      return NextResponse.json({ error: errorMessage }, { status: statusCode })
    }
  }
}

export function withAuth(handler: (request: NextRequest) => Promise<NextResponse>) {
  return withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
    const { requireAuth } = await import("./session")
    await requireAuth(request)
    return await handler(request)
  })
}
