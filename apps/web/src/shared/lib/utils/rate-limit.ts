/**
 * Simple in-memory rate limiter
 * In production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: Request) => string // Function to generate rate limit key
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>()

  constructor(private options: RateLimitOptions) {}

  isRateLimited(key: string): {
    limited: boolean
    remaining: number
    resetTime: number
  } {
    const now = Date.now()
    const entry = this.limits.get(key)

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.options.windowMs,
      })
      return {
        limited: false,
        remaining: this.options.maxRequests - 1,
        resetTime: now + this.options.windowMs,
      }
    }

    if (entry.count >= this.options.maxRequests) {
      return { limited: true, remaining: 0, resetTime: entry.resetTime }
    }

    // Increment counter
    entry.count++
    return {
      limited: false,
      remaining: this.options.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }

  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }
}

// Global rate limiters for different endpoints
const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  keyGenerator: (request: Request) => {
    // Use IP address as key, fallback to a default for server-side
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `auth:${ip}`
  },
})

const loginRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10, // 10 login attempts per 5 minutes
  keyGenerator: (request: Request) => {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `login:${ip}`
  },
})

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    authRateLimiter.cleanup()
    loginRateLimiter.cleanup()
  },
  5 * 60 * 1000
)

export { authRateLimiter, loginRateLimiter }
export type { RateLimitOptions }
