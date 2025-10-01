import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(request: NextRequest) {
  // Check super-admin role
  const auth = await withRoleCheck(['admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    // Get all studios with statistics
    const studios = await prisma.studio.findMany({
      include: {
        _count: {
          select: {
            photographers: true,
            photos: true,
            photoSessions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const studiosWithStats = studios.map((studio) => ({
      id: studio.id,
      name: studio.name,
      email: studio.email,
      createdAt: studio.createdAt,
      photographersCount: studio._count.photographers,
      photosCount: studio._count.photos,
      sessionsCount: studio._count.photoSessions,
    }))

    return NextResponse.json({
      studios: studiosWithStats,
      total: studiosWithStats.length,
    })
  } catch (error) {
    console.error('Super admin studios API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Check super-admin role
  const auth = await withRoleCheck(['admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const { name, email } = await request.json()

    if (!name || !name.trim() || !email || !email.trim()) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if studio with this email already exists
    const existingStudio = await prisma.studio.findUnique({
      where: { email: email.trim() },
    })

    if (existingStudio) {
      return NextResponse.json(
        { error: 'Studio with this email already exists' },
        { status: 409 }
      )
    }

    // Create new studio
    const studio = await prisma.studio.create({
      data: {
        name: name.trim(),
        email: email.trim(),
      },
    })

    return NextResponse.json({
      success: true,
      studio: {
        ...studio,
        guestsCount: 0,
        photosCount: 0,
        ordersCount: 0,
      },
    })
  } catch (error) {
    console.error('Create studio API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
