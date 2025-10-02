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
  // Only admin can access
  const auth = await withRoleCheck(['admin'], request)
  if (auth instanceof NextResponse) {
    return auth
  }

  try {
    // Get all studio-admins (photographers with role studio-admin)
    const studioAdmins = await prisma.photographer.findMany({
      where: {
        // We'll identify studio-admins by checking if they have a corresponding auth user
        // with role 'studio-admin' in Supabase
      },
      include: {
        studio: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    // Get all Supabase users to filter studio-admins
    const {
      data: { users },
      error: usersError,
    } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error('Error fetching Supabase users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    const studioAdminEmails = new Set(
      users
        ?.filter((u) => u.user_metadata?.role === 'studio-admin')
        .map((u) => u.email) || []
    )

    const filteredAdmins = studioAdmins.filter(
      (admin) => admin.email && studioAdminEmails.has(admin.email)
    )

    const formattedAdmins = filteredAdmins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      studio: admin.studio,
      createdAt: admin.createdAt,
      photoCount: admin._count.photos,
      sessionCount: admin._count.photoSessions,
    }))

    return NextResponse.json({ studioAdmins: formattedAdmins })
  } catch (error) {
    console.error('Studio admins fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch studio admins' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Only admin can create studio-admins
  const auth = await withRoleCheck(['admin'], request)
  if (auth instanceof NextResponse) {
    return auth
  }

  try {
    const body = await request.json()
    const { name, email, password, phone, studioId } = body

    if (!name || !email || !password || !studioId) {
      return NextResponse.json(
        { error: 'Name, email, password, and studio ID are required' },
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

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if studio exists
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
    })

    if (!studio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
    }

    // Check if photographer with this email already exists
    const existingPhotographer = await prisma.photographer.findFirst({
      where: {
        email: email.trim().toLowerCase(),
      },
    })

    if (existingPhotographer) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create Supabase auth user with studio-admin role
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        email_confirm: true,
        user_metadata: {
          role: 'studio-admin',
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

    // Create photographer record in database
    const photographer = await prisma.photographer.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        studioId: studioId,
      },
      include: {
        studio: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            photos: true,
            photoSessions: true,
          },
        },
      },
    })

    const formattedAdmin = {
      id: photographer.id,
      name: photographer.name,
      email: photographer.email,
      phone: photographer.phone,
      studio: photographer.studio,
      authUserId: authUser.user.id,
      createdAt: photographer.createdAt,
      photoCount: photographer._count.photos,
      sessionCount: photographer._count.photoSessions,
    }

    return NextResponse.json({
      studioAdmin: formattedAdmin,
      message: 'Studio admin created successfully',
    })
  } catch (error) {
    console.error('Studio admin creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create studio admin' },
      { status: 500 }
    )
  }
}
