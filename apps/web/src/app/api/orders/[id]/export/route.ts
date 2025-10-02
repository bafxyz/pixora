import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check role - admin, studio-admin, or photographer can export orders
  const auth = await withRoleCheck(
    ['admin', 'studio-admin', 'photographer'],
    request
  )
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const { id } = await params

    // Build where clause based on user role
    let whereClause: any = { id }

    if (auth.user.role === 'photographer') {
      // Photographers can only export orders from their sessions
      const photographer = await prisma.photographer.findFirst({
        where: { email: auth.user.email },
        select: { id: true, studioId: true },
      })

      if (!photographer) {
        return NextResponse.json(
          { error: 'Photographer not found' },
          { status: 404 }
        )
      }

      whereClause = {
        id,
        photographerId: photographer.id,
        studioId: photographer.studioId,
      }
    } else if (auth.user.role === 'studio-admin') {
      // Studio admins can export orders from their studio
      whereClause = {
        id,
        studioId: auth.studioId,
      }
    }

    const order = await prisma.order.findUnique({
      where: whereClause,
      include: {
        session: {
          select: {
            id: true,
            name: true,
            scheduledAt: true,
          },
        },
        photographer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        studio: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            photo: {
              select: {
                id: true,
                fileName: true,
                filePath: true,
                fileSize: true,
                createdAt: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Create export data structure
    const exportData = {
      exportInfo: {
        orderId: order.id,
        exportDate: new Date().toISOString(),
        exportedBy: auth.user.email,
        userRole: auth.user.role,
      },
      order: {
        id: order.id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount),
        discount: Number(order.discount),
        finalAmount: Number(order.finalAmount),
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        processedAt: order.processedAt,
        completedAt: order.completedAt,
      },
      guest: {
        email: order.guestEmail,
        name: order.guestName,
        phone: order.guestPhone,
      },
      session: {
        id: order.session.id,
        name: order.session.name,
        scheduledAt: order.session.scheduledAt,
      },
      photographer: {
        id: order.photographer.id,
        name: order.photographer.name,
        email: order.photographer.email,
      },
      studio: {
        id: order.studio.id,
        name: order.studio.name,
      },
      items: order.items.map((item) => ({
        id: item.id,
        price: Number(item.price),
        photo: {
          id: item.photo.id,
          fileName: item.photo.fileName,
          filePath: item.photo.filePath,
          fileSize: item.photo.fileSize,
          uploadedAt: item.photo.createdAt,
        },
      })),
      summary: {
        totalItems: order.items.length,
        subtotal: Number(order.totalAmount),
        discountAmount: Number(order.discount),
        finalTotal: Number(order.finalAmount),
        averageItemPrice:
          order.items.length > 0
            ? Number(order.finalAmount) / order.items.length
            : 0,
      },
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Export order API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
