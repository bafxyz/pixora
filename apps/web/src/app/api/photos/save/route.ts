import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  canAccessClientResource,
  withRoleCheck,
} from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

// Define validation schema using Zod
const SavePhotosSchema = z
  .object({
    guestId: z.string().optional(),
    photoSessionId: z.string().optional(),
    photoUrls: z
      .array(z.string().url())
      .min(1, 'At least one photo URL is required'),
  })
  .refine((data) => data.guestId || data.photoSessionId, {
    message: 'Either guestId or photoSessionId is required',
  })

type SavePhotosRequest = z.infer<typeof SavePhotosSchema>

export async function POST(request: NextRequest) {
  // Check role - only photographers and admins can save photos
  const auth = await withRoleCheck(
    ['photographer', 'studio-admin', 'admin'],
    request
  )
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    // Use client_id from auth
    const clientId = auth.clientId

    if (!clientId && auth.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Client ID not found' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate request body using Zod schema
    const validationResult = SavePhotosSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { guestId, photoUrls, photoSessionId } =
      validationResult.data as SavePhotosRequest

    let guest = null
    let photoSession = null
    let targetPhotographerId = ''
    let targetClientId = clientId || ''

    if (guestId) {
      // Verify guest exists and check access rights
      guest = await prisma.guest.findFirst({
        where: {
          id: guestId,
          ...(clientId ? { clientId } : {}),
        },
        select: {
          id: true,
          photographerId: true,
          clientId: true,
        },
      })

      if (!guest) {
        return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
      }

      // Check access to client resources
      if (
        !canAccessClientResource(auth.clientId, guest.clientId, auth.user.role)
      ) {
        return NextResponse.json(
          { error: 'Forbidden: You cannot access this guest' },
          { status: 403 }
        )
      }

      targetPhotographerId = guest.photographerId
      targetClientId = guest.clientId
    }

    if (photoSessionId) {
      // Verify photo session exists and check access rights
      photoSession = await prisma.photoSession.findFirst({
        where: {
          id: photoSessionId,
          ...(clientId ? { clientId } : {}),
        },
        select: {
          id: true,
          photographerId: true,
          clientId: true,
        },
      })

      if (!photoSession) {
        return NextResponse.json(
          { error: 'Photo session not found' },
          { status: 404 }
        )
      }

      // Check access to client resources
      if (
        !canAccessClientResource(
          auth.clientId,
          photoSession.clientId,
          auth.user.role
        )
      ) {
        return NextResponse.json(
          { error: 'Forbidden: You cannot access this photo session' },
          { status: 403 }
        )
      }

      targetPhotographerId = photoSession.photographerId
      targetClientId = photoSession.clientId
    }

    // Insert photos into database with expiration date (configurable)
    const expirationDays = parseInt(
      process.env.PHOTO_EXPIRATION_DAYS || '14',
      10
    )
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + expirationDays)

    const photosToInsert = photoUrls.map((url: string) => ({
      guestId: guestId || null,
      photoSessionId: photoSessionId || null,
      photographerId: targetPhotographerId,
      clientId: targetClientId,
      filePath: url,
      fileName: url.split('/').pop() || 'photo.jpg',
      expiresAt: expirationDate,
    }))

    // Insert photos into database using transaction for atomicity
    const insertedPhotos = await prisma.$transaction(
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
