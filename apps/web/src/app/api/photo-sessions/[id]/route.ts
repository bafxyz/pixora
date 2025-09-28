import { type NextRequest, NextResponse } from 'next/server'
import {
  canAccessClientResource,
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
        client: {
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
            guests: true,
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
        client: {
          id: photoSession.client.id,
          name: photoSession.client.name,
          branding: photoSession.client.branding
            ? JSON.parse(JSON.stringify(photoSession.client.branding))
            : undefined,
        },
        photos: photoSession.photos,
        guestCount: photoSession._count.guests,
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
        clientId: true,
      },
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Photo session not found' },
        { status: 404 }
      )
    }

    // Check access to client resources
    if (
      !canAccessClientResource(
        auth.clientId,
        existingSession.clientId,
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
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined)
      updateData.description = description?.trim() || null
    if (status !== undefined) updateData.status = status
    if (scheduledAt !== undefined)
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    if (completedAt !== undefined)
      updateData.completedAt = completedAt ? new Date(completedAt) : null

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
            guests: true,
            photos: true,
          },
        },
      },
    })

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
        guestCount: updatedSession._count.guests,
        photoCount: updatedSession._count.photos,
      },
    })
  } catch (error) {
    console.error('Update photo session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
