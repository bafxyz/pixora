import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'
import { createClient } from '@/shared/lib/supabase/server'
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

    const { email, password, name } = validation.data

    // Create Supabase client
    console.log('🔗 Creating Supabase client...')
    const supabase = await createClient()
    console.log('✅ Supabase client created')

    // Register with Supabase
    console.log('📧 Registering with Supabase:', {
      email,
      hasPassword: !!password,
    })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null,
        },
      },
    })

    if (error) {
      console.error('❌ Supabase registration error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('✅ Supabase registration successful:', {
      userId: data.user?.id,
      confirmed: !!data.user?.email_confirmed_at,
    })

    if (!data.user) {
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 400 }
      )
    }

    // Create client and photographer records in database
    console.log('📝 Creating database records...')
    const clientName = name || email.split('@')[0] || 'User'

    console.log('👤 Creating client:', { name: clientName, email })
    const client = await prisma.client.create({
      data: {
        name: clientName,
        email,
      },
    })
    console.log('✅ Client created:', client.id)

    console.log('📸 Creating photographer:', {
      email,
      clientId: client.id,
      name,
    })
    const photographer = await prisma.photographer.create({
      data: {
        email,
        clientId: client.id,
        name: name || null,
      },
    })
    console.log('✅ Photographer created:', photographer.id)

    return NextResponse.json({
      user: {
        id: photographer.id,
        email: photographer.email,
        name: photographer.name,
      },
      clientId: client.id,
      message: data.user.email_confirmed_at
        ? 'Registration successful!'
        : 'Registration successful. Please check your email to confirm your account.',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
