import { type NextRequest, NextResponse } from 'next/server'
import { ApiErrors, withApiHandler } from '@/shared/lib/api-error-handler'
import { prisma } from '@/shared/lib/prisma/client'
import { createClient } from '@/shared/lib/supabase/server'
import { loginRateLimiter } from '@/shared/lib/utils/rate-limit'
import { validateRequestBody } from '@/shared/lib/utils/validation'
import { loginSchema } from '@/shared/lib/validations/auth.schemas'

export const POST = withApiHandler(async (request: NextRequest) => {
  // Rate limiting check
  const rateLimitKey = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = loginRateLimiter.isRateLimited(rateLimitKey)

  if (rateLimit.limited) {
    const { error, retryAfter } = ApiErrors.rateLimit(
      'Too many login attempts. Please try again later.',
      Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    )
    return NextResponse.json(error, {
      status: 429,
      headers: {
        'Retry-After': retryAfter?.toString() || '60',
      },
    })
  }

  const body = await request.json()

  // Validate request body
  const { email, password } = validateRequestBody(body, loginSchema)

  // Create Supabase client
  const supabase = await createClient()

  // Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const apiError = ApiErrors.unauthorized(error.message)
    return NextResponse.json(
      { error: apiError.error, code: apiError.code },
      { status: apiError.status }
    )
  }

  // Supabase login successful

  if (!data.user) {
    const apiError = ApiErrors.unauthorized('Authentication failed')
    return NextResponse.json(
      { error: apiError.error, code: apiError.code },
      { status: apiError.status }
    )
  }

  // Check user role from metadata
  const userRole = data.user.user_metadata?.role || 'photographer'

  // Only create photographer record if user is actually a photographer
  if (userRole === 'photographer') {
    // Get or create photographer record in database
    let photographer = await prisma.photographer.findFirst({
      where: { email },
      include: {
        studio: true,
      },
    })

    // If photographer doesn't exist, create one with a default studio
    if (!photographer) {
      // Create a default studio for the user
      const studio = await prisma.studio.create({
        data: {
          name: data.user.user_metadata?.name || email.split('@')[0],
          email,
        },
      })

      photographer = await prisma.photographer.create({
        data: {
          email,
          studioId: studio.id,
          name: data.user.user_metadata?.name,
        },
        include: {
          studio: true,
        },
      })
    }

    return NextResponse.json({
      user: {
        id: photographer.id,
        email: photographer.email,
        name: photographer.name,
        role: userRole,
      },
      studioId: photographer.studioId,
    })
  }

  // For non-photographer users, just return user data without database record
  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email || email,
      name: data.user.user_metadata?.name || email.split('@')[0],
      role: userRole,
    },
  })
})
