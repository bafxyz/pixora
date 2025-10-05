import archiver from 'archiver'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params

    // Fetch session with photos
    const session = await prisma.photoSession.findUnique({
      where: { id: sessionId },
      include: {
        photos: {
          where: { isSelected: true },
          select: {
            id: true,
            filePath: true,
            fileName: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        orders: {
          where: {
            paymentStatus: 'paid',
          },
          select: {
            id: true,
            guestEmail: true,
            items: {
              select: {
                productType: true,
              },
            },
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if there are paid orders with digital product for this session
    const hasDigitalOrder = session.orders.some((order) =>
      order.items.some((item) => item.productType === 'digital')
    )

    if (!hasDigitalOrder) {
      return NextResponse.json(
        { error: 'No paid digital package found for this session' },
        { status: 403 }
      )
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
    console.error('Download session photos error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
