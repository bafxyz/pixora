import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiErrors, withApiHandler } from '@/shared/lib/api-error-handler'
import {
  canAccessStudioResource,
  withRoleCheck,
} from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'
import { validateRequestBody } from '@/shared/lib/utils/validation'

// Define validation schema using Zod
const SavePhotosSchema = z.object({
  photoSessionId: z.string().min(1, 'Photo session ID is required'),
  photos: z
    .array(
      z.object({
        url: z.string().url({ message: 'Invalid photo URL format' }),
        fileSize: z.number().int().nonnegative().optional(),
      })
    )
    .min(1, 'At least one photo is required'),
  // Legacy support
  photoUrls: z
    .array(z.string().url({ message: 'Invalid photo URL format' }))
    .optional(),
})

export const POST = withApiHandler(async (request: NextRequest) => {
  // Check role - only photographers and admins can save photos
  const auth = await withRoleCheck(
    ['photographer', 'studio-admin', 'admin'],
    request
  )

  if (process.env.NODE_ENV === 'development') {
    console.log('Auth passed:', {
      userId: auth.user.id,
      role: auth.user.role,
      studioId: auth.studioId,
    })
  }

  // Use studio_id from auth
  const studioId = auth.studioId

  if (!studioId && auth.user.role !== 'admin') {
    throw ApiErrors.badRequest('Studio ID not found')
  }

  const body = await request.json()

  // Validate request body using Zod schema
  const validatedData = validateRequestBody(body, SavePhotosSchema)
  const { photoSessionId } = validatedData

  // Support both new format (photos with metadata) and legacy format (photoUrls)
  const photos =
    validatedData.photos ||
    validatedData.photoUrls?.map((url) => ({ url, fileSize: undefined })) ||
    []

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
    throw ApiErrors.notFound('Photo session not found')
  }

  // Check access to studio resources
  if (
    !canAccessStudioResource(
      auth.studioId,
      photoSession.studioId,
      auth.user.role
    )
  ) {
    throw ApiErrors.forbidden('You cannot access this photo session')
  }

  const targetPhotographerId = photoSession.photographerId || auth.user.id
  const targetStudioId = photoSession.studioId

  // Insert photos into database with expiration date (configurable)
  const expirationDays = parseInt(process.env.PHOTO_EXPIRATION_DAYS || '14', 10)
  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + expirationDays)

  const photosToInsert = photos.map(
    (photo: { url: string; fileSize?: number }) => ({
      photoSessionId,
      photographerId: targetPhotographerId,
      studioId: targetStudioId,
      filePath: photo.url,
      fileName: photo.url.split('/').pop() || 'photo.jpg',
      fileSize: photo.fileSize || null,
      expiresAt: expirationDate,
    })
  )

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
})
