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
        studio: {
          select: {
            id: true,
            name: true,
            settings: true,
            pricing: {
              where: { isActive: true },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        orders: {
          where: {
            paymentStatus: 'paid',
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const activePricing = session.studio.pricing[0]
    const studioSettings =
      (session.studio.settings as Record<string, unknown>) || {}

    return NextResponse.json({
      session: {
        id: session.id,
        name: session.name,
        description: session.description,
        photographerName: session.photographer.name,
        photoCount: session.photos.length,
        hasPaidOrder: session.orders.length > 0,
        photos: session.photos,
        studio: {
          name: session.studio.name,
          logoUrl: (studioSettings.logoUrl as string) || null,
          brandColor: (studioSettings.brandColor as string) || null,
          welcomeMessage: (studioSettings.welcomeMessage as string) || null,
        },
        pricing: activePricing
          ? {
              digital: Number(activePricing.priceDigital),
              print: Number(activePricing.pricePrint),
              magnet: Number(activePricing.priceMagnet),
              currency: activePricing.currency,
              enableDigital: activePricing.enableDigital,
              enablePrint: activePricing.enablePrint,
              enableMagnet: activePricing.enableMagnet,
            }
          : {
              digital: 500,
              print: 750,
              magnet: 750,
              currency: 'RUB',
              enableDigital: true,
              enablePrint: true,
              enableMagnet: true,
            },
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
