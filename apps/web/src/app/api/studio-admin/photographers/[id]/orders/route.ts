import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'
import { createClient } from '@/shared/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photographerId } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is studio admin
    const studioAdmin = await prisma.studioAdmin.findUnique({
      where: { email: user.email as string },
      select: { studioId: true },
    })

    if (!studioAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify photographer exists and belongs to same studio
    const photographer = await prisma.photographer.findUnique({
      where: { id: photographerId },
      select: { id: true, studioId: true },
    })

    if (!photographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    if (photographer.studioId !== studioAdmin.studioId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get orders for this photographer
    const orders = await prisma.order.findMany({
      where: {
        photographerId: photographerId,
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            photo: {
              select: {
                id: true,
                fileName: true,
                filePath: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format orders for frontend
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: `ORD-${order.id.slice(0, 8).toUpperCase()}`,
      status: order.paymentStatus,
      totalAmount: Number(order.finalAmount),
      currency: 'RUB',
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      guestName: order.guestName || order.guest?.name || 'Unknown',
      guestEmail: order.guestEmail || order.guest?.email || '',
      itemCount: order.items.length,
      items: order.items.map((item) => ({
        id: item.id,
        photoId: item.photoId,
        photoFilename: item.photo.fileName,
        photoThumbnailUrl: item.photo.filePath,
        quantity: item.quantity,
        price: Number(item.price),
        size: item.productType,
      })),
    }))

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    console.error('Error in photographer orders API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
