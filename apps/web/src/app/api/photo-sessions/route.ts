import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(request: NextRequest) {
  // Check photographer, studio-admin or admin role
  const auth = await withRoleCheck(
    ['photographer', 'studio-admin', 'admin'],
    request
  )
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    // For studio-admin use their client_id, for admin - from header or all
    let clientId = auth.clientId

    // If admin and x-client-id is provided, use it
    if (auth.user.role === 'admin') {
      const headerClientId = request.headers.get('x-client-id')
      if (headerClientId) {
        clientId = headerClientId
      }
    }

    const whereClause = clientId ? { clientId } : {}

    const photoSessions = await prisma.photoSession.findMany({
      where: whereClause,
      include: {
        photographer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            guests: true,
            photos: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      photoSessions: photoSessions.map((session) => ({
        id: session.id,
        name: session.name,
        description: session.description,
        status: session.status,
        scheduledAt: session.scheduledAt,
        completedAt: session.completedAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        photographer: session.photographer,
        guestCount: session._count.guests,
        photoCount: session._count.photos,
      })),
    })
  } catch (error) {
    console.error('Photo sessions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Check photographer, studio-admin or admin role
  const auth = await withRoleCheck(
    ['photographer', 'studio-admin', 'admin'],
    request
  )
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const { name, description, scheduledAt } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Photo session name is required' },
        { status: 400 }
      )
    }

    // Use client_id from auth
    const clientId = auth.clientId

    if (!clientId && auth.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Get photographer ID
    let photographerId = ''
    if (auth.user.role === 'photographer') {
      // For photographer role, find their photographer record
      const photographer = await prisma.photographer.findFirst({
        where: { email: auth.user.email },
        select: { id: true },
      })
      if (!photographer) {
        return NextResponse.json(
          { error: 'Photographer record not found' },
          { status: 400 }
        )
      }
      photographerId = photographer.id
    } else {
      // For admin/studio-admin, find first photographer of the client
      const photographer = await prisma.photographer.findFirst({
        where: { clientId },
        select: { id: true },
      })
      if (!photographer) {
        return NextResponse.json(
          { error: 'No photographer found for this client' },
          { status: 400 }
        )
      }
      photographerId = photographer.id
    }

    // Create photo session
    const photoSession = await prisma.photoSession.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        photographerId,
        clientId: clientId || '',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
      include: {
        photographer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      photoSession: {
        id: photoSession.id,
        name: photoSession.name,
        description: photoSession.description,
        status: photoSession.status,
        scheduledAt: photoSession.scheduledAt,
        createdAt: photoSession.createdAt,
        photographer: photoSession.photographer,
        guestCount: 0,
        photoCount: 0,
      },
    })
  } catch (error) {
    console.error('Create photo session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
