import { type NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/shared/lib/utils/rate-limit'
import { validateRequestBody } from '@/shared/lib/utils/validation'
import { registerSchema } from '@/shared/lib/validations/auth.schemas'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitKey = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = authRateLimiter.isRateLimited(rateLimitKey)

    if (rateLimit.limited) {
      return NextResponse.json(
        {
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (rateLimit.resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
      )
    }

    const body = await request.json()

    // Validate request body
    const validation = validateRequestBody(body, registerSchema)
    if (!validation.success) {
      return validation.response
    }

    // Registration functionality not fully implemented yet
    // TODO: Implement Supabase authentication
    return NextResponse.json(
      { error: 'Registration is currently unavailable' },
      { status: 503 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
