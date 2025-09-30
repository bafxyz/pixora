import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

const UpdatePhotosSchema = z.object({
  updates: z.array(
    z.object({
      photoId: z.string(),
      isSelected: z.boolean(),
    })
  ),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check photographer, studio-admin or admin role
  const auth = await withRoleCheck(
    ['photographer', 'studio-admin', 'admin'],
    request
  )
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const { id: sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validationResult = UpdatePhotosSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { updates } = validationResult.data

    // Verify session exists and user has access
    const whereClause: {
      id: string
      photographerId?: string
      clientId?: string
    } = { id: sessionId }

    if (auth.user.role === 'photographer') {
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

      whereClause.photographerId = photographer.id
    } else if (auth.clientId) {
      whereClause.clientId = auth.clientId
    }

    const session = await prisma.photoSession.findFirst({
      where: whereClause,
      select: { id: true },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Photo session not found or access denied' },
        { status: 404 }
      )
    }

    // Update photos in a transaction
    await prisma.$transaction(
      updates.map(({ photoId, isSelected }) =>
        prisma.photo.update({
          where: {
            id: photoId,
            photoSessionId: sessionId, // Ensure photo belongs to this session
          },
          data: {
            isSelected: isSelected,
            updatedAt: new Date(),
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: 'Photos updated successfully',
      updatedCount: updates.length,
    })
  } catch (error) {
    console.error('Update photos API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
