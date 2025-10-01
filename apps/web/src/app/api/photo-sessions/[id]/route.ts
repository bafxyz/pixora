import { type NextRequest, NextResponse } from 'next/server'
import {
  canAccessStudioResource,
  withRoleCheck,
} from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Photo session ID is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json(
        { error: 'Photo session not found' },
        { status: 404 }
      )
    }

    // First try to find session by ID only (for public access via QR)
    const photoSession = await prisma.photoSession.findFirst({
      where: {
        id: sessionId,
      },
      include: {
        photographer: {
          select: {
            id: true,
            name: true,
            email: true,
            branding: true,
          },
        },
        studio: {
          select: {
            id: true,
            name: true,
            branding: true,
          },
        },
        photos: {
          where: {
            isSelected: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
    })

    if (!photoSession) {
      return NextResponse.json(
        { error: 'Photo session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      photoSession: {
        id: photoSession.id,
        name: photoSession.name,
        description: photoSession.description,
        status: photoSession.status,
        scheduledAt: photoSession.scheduledAt,
        completedAt: photoSession.completedAt,
        createdAt: photoSession.createdAt,
        photographer: {
          id: photoSession.photographer.id,
          name: photoSession.photographer.name,
          branding: photoSession.photographer.branding
            ? JSON.parse(JSON.stringify(photoSession.photographer.branding))
            : undefined,
        },
        studio: {
          id: photoSession.studio.id,
          name: photoSession.studio.name,
          branding: photoSession.studio.branding
            ? JSON.parse(JSON.stringify(photoSession.studio.branding))
            : undefined,
        },
        photos: photoSession.photos,
        guestCount: 0, // Guests removed from system
        photoCount: photoSession._count.photos,
      },
    })
  } catch (error) {
    console.error('Photo session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const body = await request.json()

    console.log('[PATCH] Session ID:', sessionId)
    console.log('[PATCH] Request body:', body)
    console.log(
      '[PATCH] Auth user:',
      auth.user.email,
      'Role:',
      auth.user.role,
      'StudioId:',
      auth.studioId
    )

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Photo session ID is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json(
        { error: 'Photo session not found' },
        { status: 404 }
      )
    }

    // Find session and check access rights
    const existingSession = await prisma.photoSession.findFirst({
      where: {
        id: sessionId,
      },
      select: {
        id: true,
        studioId: true,
      },
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Photo session not found' },
        { status: 404 }
      )
    }

    // Check access to studio resources
    if (
      !canAccessStudioResource(
        auth.studioId,
        existingSession.studioId,
        auth.user.role
      )
    ) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot access this photo session' },
        { status: 403 }
      )
    }

    const { name, description, status, scheduledAt, completedAt } = body

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json(
          { error: 'Name is required and must be a non-empty string' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }
    if (description !== undefined)
      updateData.description = description?.trim() || null
    if (status !== undefined) updateData.status = status
    if (scheduledAt !== undefined) {
      if (scheduledAt) {
        const date = new Date(scheduledAt)
        if (Number.isNaN(date.getTime())) {
          return NextResponse.json(
            { error: 'Invalid scheduled date format' },
            { status: 400 }
          )
        }
        updateData.scheduledAt = date
      } else {
        updateData.scheduledAt = null
      }
    }
    if (completedAt !== undefined) {
      if (completedAt) {
        const date = new Date(completedAt)
        if (Number.isNaN(date.getTime())) {
          return NextResponse.json(
            { error: 'Invalid completed date format' },
            { status: 400 }
          )
        }
        updateData.completedAt = date
      } else {
        updateData.completedAt = null
      }
    }

    console.log('[PATCH] Update data:', updateData)

    // Update photo session
    const updatedSession = await prisma.photoSession.update({
      where: {
        id: sessionId,
      },
      data: updateData,
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
            photos: true,
          },
        },
      },
    })

    console.log('[PATCH] Update successful:', updatedSession.id)

    return NextResponse.json({
      photoSession: {
        id: updatedSession.id,
        name: updatedSession.name,
        description: updatedSession.description,
        status: updatedSession.status,
        scheduledAt: updatedSession.scheduledAt,
        completedAt: updatedSession.completedAt,
        createdAt: updatedSession.createdAt,
        updatedAt: updatedSession.updatedAt,
        photographer: updatedSession.photographer,
        guestCount: 0, // Guests removed from system
        photoCount: updatedSession._count.photos,
      },
    })
  } catch (error) {
    console.error('[PATCH] Update photo session API error:', error)
    console.error(
      '[PATCH] Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    )
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
        { error: 'Photo session ID is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json(
        { error: 'Photo session not found' },
        { status: 404 }
      )
    }

    // Find session and check access rights
    const existingSession = await prisma.photoSession.findFirst({
      where: {
        id: sessionId,
      },
      select: {
        id: true,
        studioId: true,
      },
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Photo session not found' },
        { status: 404 }
      )
    }

    // Check access to studio resources
    if (
      !canAccessStudioResource(
        auth.studioId,
        existingSession.studioId,
        auth.user.role
      )
    ) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot delete this photo session' },
        { status: 403 }
      )
    }

    // Delete photo session (cascade will delete related photos)
    await prisma.photoSession.delete({
      where: {
        id: sessionId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Photo session deleted successfully',
    })
  } catch (error) {
    console.error('Delete photo session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
