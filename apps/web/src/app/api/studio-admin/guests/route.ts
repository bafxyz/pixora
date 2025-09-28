import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

type Guest = {
  id: string
  name: string
  email: string | null
  photographerId: string
  clientId: string
  createdAt: Date
  updatedAt: Date
}

type GuestWithPhotoCount = Guest & {
  _count: {
    photos: number
  }
}

export async function GET(request: NextRequest) {
  // Check studio-admin or admin role
  const auth = await withRoleCheck(['studio-admin', 'admin'], request)
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

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Get all guests of the client with photo count
    const guests = await prisma.guest.findMany({
      where: {
        clientId: clientId,
      },
      include: {
        _count: {
          select: {
            photos: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const guestsWithPhotoCount = guests.map((guest: GuestWithPhotoCount) => ({
      id: guest.id,
      name: guest.name,
      email: guest.email,
      createdAt: guest.createdAt,
      clientId: guest.clientId,
      photosCount: guest._count.photos,
    }))

    return NextResponse.json({
      guests: guestsWithPhotoCount,
      total: guestsWithPhotoCount.length,
    })
  } catch (error) {
    console.error('Admin guests API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Check admin, super-admin or photographer role
  const auth = await withRoleCheck(
    ['studio-admin', 'admin', 'photographer'],
    request
  )
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const { name, photographerId } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Guest name is required' },
        { status: 400 }
      )
    }

    // Use client_id from auth
    const clientId = auth.clientId

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Create guest
    const guest = await prisma.guest.create({
      data: {
        name: name.trim(),
        clientId: clientId,
        email: null,
        // Use photographerId from request or find first photographer of the client
        photographerId:
          photographerId ||
          (
            await prisma.photographer.findFirst({
              where: { clientId },
              select: { id: true },
            })
          )?.id ||
          '',
      },
    })

    return NextResponse.json({
      success: true,
      guest: {
        ...guest,
        photosCount: 0,
      },
    })
  } catch (error) {
    console.error('Create guest API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
