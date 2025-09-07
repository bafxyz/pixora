import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'
import { validateRequestBody } from '@/shared/lib/utils/validation'
import { updateGuestSchema } from '@/shared/lib/validations/auth.schemas'

interface GalleryResponse {
  guest: {
    id: string
    name: string
    email: string | null
    photographerId: string
    clientId: string
    createdAt: Date
    updatedAt: Date
  }
  photos: {
    id: string
    photographerId: string
    guestId: string | null
    clientId: string
    filePath: string
    fileName: string
    fileSize: number | null
    isSelected: boolean
    createdAt: Date
    updatedAt: Date
  }[]
  photographer: {
    id: string
    name: string | null
    branding?: Record<string, unknown>
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guestId } = await params

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      )
    }

    // Get client_id from request headers (set by middleware)
    // For public gallery access, we'll try to find the guest without client_id first
    const clientId = request.headers.get('x-client-id')

    // First try to find guest by ID only (for public access)
    let guest = await prisma.guest.findFirst({
      where: {
        id: guestId,
      },
    })

    // If no guest found and we have a client_id, try with client isolation
    if (!guest && clientId) {
      guest = await prisma.guest.findFirst({
        where: {
          id: guestId,
          clientId: clientId,
        },
      })
    }

    if (!guest) {
      // Return empty response instead of 404 for better UX
      return NextResponse.json({
        guest: null,
        photos: [],
        photographer: {
          id: 'default',
          name: 'Gallery',
          branding: undefined,
        },
      })
    }

    // Get photos for this guest
    // Use clientId from guest if we don't have it from headers
    const effectiveClientId = clientId || guest.clientId

    const photos = await prisma.photo.findMany({
      where: {
        guestId: guestId,
        clientId: effectiveClientId,
        isSelected: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get photographer information if photographerId exists
    let photographer = null
    if (guest.photographerId) {
      photographer = await prisma.photographer.findFirst({
        where: {
          id: guest.photographerId,
          clientId: effectiveClientId,
        },
        select: {
          id: true,
          name: true,
          branding: true,
        },
      })
    }

    const response: GalleryResponse = {
      guest,
      photos: photos,
      photographer: photographer
        ? {
            id: photographer.id,
            name: photographer.name,
            branding: photographer.branding
              ? JSON.parse(JSON.stringify(photographer.branding))
              : undefined,
          }
        : {
            id: 'default',
            name: 'Gallery',
            branding: undefined,
          },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Gallery API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guestId } = await params

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate request body
    const validation = validateRequestBody(body, updateGuestSchema)
    if (!validation.success) {
      return validation.response
    }

    // Get client_id from request headers
    const clientId = request.headers.get('x-client-id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 401 }
      )
    }

    // Verify guest exists with client isolation
    const existingGuest = await prisma.guest.findFirst({
      where: {
        id: guestId,
        clientId: clientId,
      },
      select: { id: true },
    })

    if (!existingGuest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Update guest information (e.g., name, email)
    const { name, email } = validation.data
    const updatedGuest = await prisma.guest.update({
      where: {
        id: guestId,
      },
      data: {
        name,
        email,
      },
    })

    return NextResponse.json({ guest: updatedGuest })
  } catch (error) {
    console.error('Gallery update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
