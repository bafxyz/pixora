import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params

    // Fetch session with all photos
    const session = await prisma.photoSession.findUnique({
      where: { id: sessionId },
      include: {
        photos: {
          select: {
            id: true,
            filePath: true,
            fileName: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        photographer: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({
      session: {
        id: session.id,
        name: session.name,
        description: session.description,
        photographerName: session.photographer.name,
        photoCount: session.photos.length,
        photos: session.photos,
      },
    })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
