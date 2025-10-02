import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'
import { createClient } from '@/shared/lib/supabase/client'
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
    const validatedData = validateRequestBody(body, registerSchema)
    const { email, password, name, role, studioName } = validatedData

    const supabase = await createClient()

    // Check if user already exists in Supabase
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('Error checking existing users:', listError)
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      )
    }

    const existingUser = users.find((user) => user.email === email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create user in Supabase
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role,
        },
      })

    if (authError || !authData.user) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // For studio roles, create studio record
    let studioId = null
    if (role === 'studio-admin' && studioName) {
      const studio = await prisma.studio.create({
        data: {
          name: studioName,
          email,
        },
      })
      studioId = studio.id
    } else if (role === 'photographer') {
      // For photographers, they need to be invited to a studio
      // For now, we'll create them without a studio
      return NextResponse.json(
        { error: 'Photographers must be invited to a studio' },
        { status: 400 }
      )
    }

    // Create user record in our database
    if (role === 'studio-admin' && studioId) {
      // Studio admin is linked to studio
      await prisma.studio.update({
        where: { id: studioId },
        data: {
          // Studio admin is the studio itself
        },
      })
    }

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role,
          name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
