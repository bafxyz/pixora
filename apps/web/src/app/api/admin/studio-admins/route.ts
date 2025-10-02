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
    // Get all studio-admins from dedicated table
    const studioAdmins = await prisma.studioAdmin.findMany({
      include: {
        studio: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedAdmins = studioAdmins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      studio: admin.studio,
      createdAt: admin.createdAt,
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

    // Check if studio admin with this email already exists
    const existingStudioAdmin = await prisma.studioAdmin.findFirst({
      where: {
        email: email.trim().toLowerCase(),
      },
    })

    if (existingStudioAdmin) {
      return NextResponse.json(
        { error: 'Studio admin with this email already exists' },
        { status: 400 }
      )
    }

    // Also check photographer table to prevent conflicts
    const existingPhotographer = await prisma.photographer.findFirst({
      where: {
        email: email.trim().toLowerCase(),
      },
    })

    if (existingPhotographer) {
      return NextResponse.json(
        { error: 'User with this email already exists as photographer' },
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

    // Create studio admin record in database
    const studioAdmin = await prisma.studioAdmin.create({
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
      },
    })

    const formattedAdmin = {
      id: studioAdmin.id,
      name: studioAdmin.name,
      email: studioAdmin.email,
      phone: studioAdmin.phone,
      studio: studioAdmin.studio,
      authUserId: authUser.user.id,
      createdAt: studioAdmin.createdAt,
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
