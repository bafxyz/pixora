import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(request: NextRequest) {
  // Check photographer, studio-admin or admin role
  const auth = await withRoleCheck(
    ['photographer', 'studio-admin', 'admin'],
    request
  )
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    // For studio-admin use their studio_id, for admin - from header or all
    let studioId = auth.studioId

    // If admin and x-studio-id is provided, use it
    if (auth.user.role === 'admin') {
      const headerStudioId = request.headers.get('x-studio-id')
      if (headerStudioId) {
        studioId = headerStudioId
      }
    }

    const whereClause = studioId ? { studioId } : {}

    const photoSessions = await prisma.photoSession.findMany({
      where: whereClause,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      photoSessions: photoSessions.map((session) => ({
        id: session.id,
        name: session.name,
        description: session.description,
        status: session.status,
        scheduledAt: session.scheduledAt,
        completedAt: session.completedAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        photographer: session.photographer,
        guestCount: 0, // Guests removed from system
        photoCount: session._count.photos,
      })),
    })
  } catch (error) {
    console.error('Photo sessions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Check photographer, studio-admin or admin role
  const auth = await withRoleCheck(
    ['photographer', 'studio-admin', 'admin'],
    request
  )
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const { name, description, scheduledAt } = await request.json()

    // Validate and sanitize inputs
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Photo session name is required' },
        { status: 400 }
      )
    }

    if (description && typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      )
    }

    // Validate name length
    if (name.trim().length > 255) {
      return NextResponse.json(
        { error: 'Photo session name is too long (max 255 characters)' },
        { status: 400 }
      )
    }

    // Validate description length
    if (description && description.length > 1000) {
      return NextResponse.json(
        { error: 'Description is too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Validate scheduledAt if provided
    let validatedScheduledAt: Date | null = null
    if (scheduledAt) {
      if (typeof scheduledAt !== 'string') {
        return NextResponse.json(
          { error: 'Scheduled date must be a string in ISO format' },
          { status: 400 }
        )
      }

      const date = new Date(scheduledAt)
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduled date format' },
          { status: 400 }
        )
      }

      // Ensure date is not too far in the future (e.g., not more than 2 years)
      const maxAllowedDate = new Date()
      maxAllowedDate.setFullYear(maxAllowedDate.getFullYear() + 2)
      if (date > maxAllowedDate) {
        return NextResponse.json(
          { error: 'Scheduled date cannot be more than 2 years in the future' },
          { status: 400 }
        )
      }

      validatedScheduledAt = date
    }

    // Use studio_id from auth
    const studioId = auth.studioId

    if (!studioId && auth.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      )
    }

    // Get photographer ID
    let photographerId = ''
    if (auth.user.role === 'photographer') {
      // For photographer role, find their photographer record
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
      photographerId = photographer.id
    } else {
      // For admin/studio-admin, find first photographer of the studio
      const photographer = await prisma.photographer.findFirst({
        where: { studioId },
        select: { id: true },
      })
      if (!photographer) {
        return NextResponse.json(
          { error: 'No photographer found for this studio' },
          { status: 400 }
        )
      }
      photographerId = photographer.id
    }

    // Create photo session
    const photoSession = await prisma.photoSession.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        photographerId,
        studioId: studioId || '',
        scheduledAt: validatedScheduledAt,
      },
      include: {
        photographer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      photoSession: {
        id: photoSession.id,
        name: photoSession.name,
        description: photoSession.description,
        status: photoSession.status,
        scheduledAt: photoSession.scheduledAt,
        createdAt: photoSession.createdAt,
        photographer: photoSession.photographer,
        guestCount: 0,
        photoCount: 0,
      },
    })
  } catch (error) {
    console.error('Create photo session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
