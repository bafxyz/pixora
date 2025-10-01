import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'
import { createClient } from '@/shared/lib/supabase/server'
import { loginRateLimiter } from '@/shared/lib/utils/rate-limit'
import { validateRequestBody } from '@/shared/lib/utils/validation'
import { loginSchema } from '@/shared/lib/validations/auth.schemas'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitKey = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = loginRateLimiter.isRateLimited(rateLimitKey)

    if (rateLimit.limited) {
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
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
    const validation = validateRequestBody(body, loginSchema)
    if (!validation.success) {
      return validation.response
    }

    const { email, password } = validation.data

    // Create Supabase client
    const supabase = await createClient()

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Supabase login error:', error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Supabase login successful

    if (!data.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
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
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
