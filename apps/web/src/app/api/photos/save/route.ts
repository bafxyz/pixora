import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'

export async function POST(request: NextRequest) {
  try {
    // Get client_id from headers (set by middleware)
    const clientId = request.headers.get('x-client-id')
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID not found' },
        { status: 400 }
      )
    }

    const { guestId, photoUrls } = await request.json()

    if (!guestId || !photoUrls || !Array.isArray(photoUrls)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Verify guest exists and belongs to this client
    const guest = await prisma.guest.findFirst({
      where: {
        id: guestId,
        clientId: clientId,
      },
      select: {
        id: true,
        photographerId: true,
      },
    })

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Insert photos into database
    const photosToInsert = photoUrls.map((url: string) => ({
      guestId: guestId,
      photographerId: guest.photographerId,
      clientId: clientId,
      filePath: url,
      fileName: url.split('/').pop() || 'photo.jpg',
    }))

    // Insert photos into database
    const insertedPhotos = await Promise.all(
      photosToInsert.map((photoData) =>
        prisma.photo.create({
          data: photoData,
          select: {
            id: true,
            filePath: true,
            fileName: true,
            createdAt: true,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      photos: insertedPhotos,
      count: insertedPhotos.length,
    })
  } catch (error) {
    console.error('Save photos error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
