import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables for Supabase')
}

// Admin client for creating users
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: NextRequest) {
  // Check studio-admin or admin role
  const auth = await withRoleCheck(['studio-admin', 'admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    // For studio-admin, only show photographers from their studio
    // For admin, show all photographers or by studio header
    let studioId = auth.studioId

    if (auth.user.role === 'admin') {
      const headerStudioId = request.headers.get('x-studio-id')
      if (headerStudioId) {
        studioId = headerStudioId
      }
    }

    if (!studioId) {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      )
    }

    // Get photographers with statistics
    const photographers = await prisma.photographer.findMany({
      where: { studioId: studioId },
      include: {
        _count: {
          select: {
            photos: true,
            photoSessions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format response
    const formattedPhotographers = photographers.map((photographer) => ({
      id: photographer.id,
      name: photographer.name,
      email: photographer.email,
      phone: photographer.phone,
      branding: photographer.branding,
      createdAt: photographer.createdAt,
      photoCount: photographer._count.photos,
      sessionCount: photographer._count.photoSessions,
    }))

    return NextResponse.json({ photographers: formattedPhotographers })
  } catch (error) {
    console.error('Photographers fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photographers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Check studio-admin or admin role
  const auth = await withRoleCheck(['studio-admin', 'admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const body = await request.json()
    const { name, email, phone, password } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Password is optional, but if provided must be at least 6 characters
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // For studio-admin, use their studio
    // For admin, use studio from header
    let studioId = auth.studioId

    if (auth.user.role === 'admin') {
      const headerStudioId = request.headers.get('x-studio-id')
      if (headerStudioId) {
        studioId = headerStudioId
      }
    }

    if (!studioId) {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      )
    }

    // Check if photographer with this email already exists
    const existingPhotographer = await prisma.photographer.findFirst({
      where: {
        email: email.trim().toLowerCase(),
      },
    })

    if (existingPhotographer) {
      return NextResponse.json(
        { error: 'Photographer with this email already exists' },
        { status: 400 }
      )
    }

    // Create Supabase auth user if password is provided
    let authUserId: string | undefined
    if (password) {
      const { data: authUser, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: email.trim().toLowerCase(),
          password: password,
          email_confirm: true,
          user_metadata: {
            role: 'photographer',
            name: name.trim(),
            studioId: studioId,
          },
        })

      if (authError || !authUser.user) {
        console.error('Supabase user creation error:', authError)
        return NextResponse.json(
          { error: authError?.message || 'Failed to create auth user' },
          { status: 500 }
        )
      }

      authUserId = authUser.user.id
    }

    // Create photographer
    const photographer = await prisma.photographer.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        studioId: studioId,
        // Default branding settings
        branding: {
          brandColor: '#000000',
          logoUrl: '',
          welcomeMessage: `Добро пожаловать в галерею ${name}!`,
        },
      },
      include: {
        _count: {
          select: {
            photos: true,
            photoSessions: true,
          },
        },
      },
    })

    // Format response
    const formattedPhotographer = {
      id: photographer.id,
      name: photographer.name,
      email: photographer.email,
      phone: photographer.phone,
      branding: photographer.branding,
      createdAt: photographer.createdAt,
      photoCount: photographer._count.photos,
      sessionCount: photographer._count.photoSessions,
      authUserId,
    }

    return NextResponse.json({
      photographer: formattedPhotographer,
      message: 'Photographer created successfully',
    })
  } catch (error) {
    console.error('Photographer creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create photographer' },
      { status: 500 }
    )
  }
}
