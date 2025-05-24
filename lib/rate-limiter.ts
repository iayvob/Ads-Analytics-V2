import { APP_CONFIG } from "./config"

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()

  isRateLimited(identifier: string): boolean {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.store.set(identifier, {
        count: 1,
        resetTime: now + APP_CONFIG.RATE_LIMIT_WINDOW,
      })
      return false
    }

    if (entry.count >= APP_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
      return true
    }

    entry.count++
    return false
  }

  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

export const rateLimiter = new RateLimiter()

// Cleanup expired entries every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000)
