import archiver from 'archiver'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'
import { createClient } from '@/shared/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is photographer or studio admin
    const photographer = await prisma.photographer.findUnique({
      where: { email: user.email as string },
    })

    const studioAdmin = await prisma.studioAdmin.findUnique({
      where: { email: user.email as string },
    })

    if (!photographer && !studioAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch session with photos
    const session = await prisma.photoSession.findUnique({
      where: { id: sessionId },
      include: {
        photos: {
          select: {
            id: true,
            filePath: true,
            fileName: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verify access rights
    if (photographer && session.photographerId !== photographer.id) {
      // Check if photographer belongs to same studio
      if (session.studioId !== photographer.studioId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    if (studioAdmin && session.studioId !== studioAdmin.studioId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (session.photos.length === 0) {
      return NextResponse.json(
        { error: 'No photos available for download' },
        { status: 404 }
      )
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    })

    // Convert archive to web stream
    const readableStream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk) => {
          controller.enqueue(chunk)
        })

        archive.on('end', () => {
          controller.close()
        })

        archive.on('error', (err) => {
          controller.error(err)
        })
      },
    })

    // Add photos to archive
    for (const photo of session.photos) {
      try {
        // Fetch photo from storage URL
        const photoResponse = await fetch(photo.filePath)
        if (!photoResponse.ok) {
          console.error(`Failed to fetch photo: ${photo.fileName}`)
          continue
        }

        const photoBuffer = await photoResponse.arrayBuffer()
        archive.append(Buffer.from(photoBuffer), { name: photo.fileName })
      } catch (error) {
        console.error(`Error adding photo ${photo.fileName} to archive:`, error)
      }
    }

    // Finalize archive
    archive.finalize()

    // Return ZIP file
    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${session.name.replace(/[^a-zA-Z0-9]/g, '_')}_photos.zip"`,
      },
    })
  } catch (error) {
    console.error('Download photographer session photos error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
