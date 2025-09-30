import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(
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

    // Build where clause based on role
    const whereClause: {
      id: string
      photographerId?: string
      clientId?: string
    } = { id: sessionId }

    if (auth.user.role === 'photographer') {
      // For photographers, only show their sessions
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
      // For studio-admin, only show sessions from their client
      whereClause.clientId = auth.clientId
    }

    const session = await prisma.photoSession.findFirst({
      where: whereClause,
      include: {
        photographer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        photos: {
          select: {
            id: true,
            filePath: true,
            fileName: true,
            fileSize: true,
            isSelected: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Photo session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        name: session.name,
        description: session.description,
        status: session.status,
        scheduledAt: session.scheduledAt,
        createdAt: session.createdAt,
        photographer: session.photographer,
        photos: session.photos,
      },
    })
  } catch (error) {
    console.error('Session details API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
