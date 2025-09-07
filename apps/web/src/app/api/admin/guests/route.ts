import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Получаем client_id из заголовков
    const clientId = request.headers.get('x-client-id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 401 }
      )
    }

    // Получаем всех гостей клиента с количеством фото
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

    const guestsWithPhotoCount = guests.map((guest) => ({
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
  try {
    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Guest name is required' },
        { status: 400 }
      )
    }

    // Получаем client_id из заголовков
    const clientId = request.headers.get('x-client-id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 401 }
      )
    }

    // Создаем гостя
    const guest = await prisma.guest.create({
      data: {
        name: name.trim(),
        clientId: clientId,
        email: null,
        // Note: You'll need to provide photographerId as well
        // This might need to be passed from the frontend or determined by business logic
        photographerId: 'default-photographer-id', // Replace with actual logic
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
