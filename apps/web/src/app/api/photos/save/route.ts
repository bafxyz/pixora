import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  canAccessStudioResource,
  withRoleCheck,
} from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

// Define validation schema using Zod
const SavePhotosSchema = z.object({
  photoSessionId: z.string().min(1, 'Photo session ID is required'),
  photoUrls: z
    .array(z.string().url())
    .min(1, 'At least one photo URL is required'),
})

type SavePhotosRequest = z.infer<typeof SavePhotosSchema>

export async function POST(request: NextRequest) {
  // Check role - only photographers and admins can save photos
  const auth = await withRoleCheck(
    ['photographer', 'studio-admin', 'admin'],
    request
  )
  if (auth instanceof NextResponse) {
    console.error('Auth check failed')
    return auth // Return 403/401 error
  }

  console.log('Auth passed:', {
    userId: auth.user.id,
    role: auth.user.role,
    studioId: auth.studioId,
  })

  try {
    // Use studio_id from auth
    const studioId = auth.studioId

    if (!studioId && auth.user.role !== 'admin') {
      console.error('Studio ID not found for non-admin user')
      return NextResponse.json(
        { error: 'Studio ID not found' },
        { status: 400 }
      )
    }

    const body = await request.json()
    // Log request body in development

    // Validate request body using Zod schema
    const validationResult = SavePhotosSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.issues)
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { photoUrls, photoSessionId } =
      validationResult.data as SavePhotosRequest

    // Processing photo save request

    // Verify photo session exists and check access rights
    const photoSession = await prisma.photoSession.findFirst({
      where: {
        id: photoSessionId,
        ...(studioId ? { studioId } : {}),
      },
      select: {
        id: true,
        photographerId: true,
        studioId: true,
      },
    })

    if (!photoSession) {
      return NextResponse.json(
        { error: 'Photo session not found' },
        { status: 404 }
      )
    }

    // Check access to studio resources
    if (
      !canAccessStudioResource(
        auth.studioId,
        photoSession.studioId,
        auth.user.role
      )
    ) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot access this photo session' },
        { status: 403 }
      )
    }

    const targetPhotographerId = photoSession.photographerId || auth.user.id // Use user ID as fallback
    const targetStudioId = photoSession.studioId

    // Insert photos into database with expiration date (configurable)
    const expirationDays = parseInt(
      process.env.PHOTO_EXPIRATION_DAYS || '14',
      10
    )
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + expirationDays)

    const photosToInsert = photoUrls.map((url: string) => ({
      photoSessionId: photoSessionId,
      photographerId: targetPhotographerId,
      studioId: targetStudioId,
      filePath: url,
      fileName: url.split('/').pop() || 'photo.jpg',
      expiresAt: expirationDate,
    }))

    // Insert photos into database using transaction for atomicity
    try {
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
    } catch (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json(
        {
          error: 'Failed to save photos to database',
          details:
            dbError instanceof Error
              ? dbError.message
              : 'Unknown database error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Save photos error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
