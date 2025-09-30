import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(request: NextRequest) {
  // Check studio-admin or admin role
  const auth = await withRoleCheck(['studio-admin', 'admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    // For studio-admin, only show photographers from their client
    // For admin, show all photographers or by client header
    let clientId = auth.clientId

    if (auth.user.role === 'admin') {
      const headerClientId = request.headers.get('x-client-id')
      if (headerClientId) {
        clientId = headerClientId
      }
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Get photographers with statistics
    const photographers = await prisma.photographer.findMany({
      where: { clientId },
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
    const { name, email, phone } = body

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

    // For studio-admin, use their client
    // For admin, use client from header
    let clientId = auth.clientId

    if (auth.user.role === 'admin') {
      const headerClientId = request.headers.get('x-client-id')
      if (headerClientId) {
        clientId = headerClientId
      }
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Check if photographer with this email already exists
    const existingPhotographer = await prisma.photographer.findFirst({
      where: {
        email,
        clientId,
      },
    })

    if (existingPhotographer) {
      return NextResponse.json(
        { error: 'Photographer with this email already exists' },
        { status: 400 }
      )
    }

    // Create photographer
    const photographer = await prisma.photographer.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        clientId,
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
