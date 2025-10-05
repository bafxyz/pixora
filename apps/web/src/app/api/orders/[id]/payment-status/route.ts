import type { Prisma } from '@prisma/client'
import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check role - admin, studio-admin, or photographer can update payment status
  const auth = await withRoleCheck(
    ['admin', 'studio-admin', 'photographer'],
    request
  )
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { paymentStatus } = body

    if (
      !paymentStatus ||
      !['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)
    ) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 }
      )
    }

    // Build where clause based on user role
    let whereClause: Prisma.OrderWhereUniqueInput = { id }

    if (auth.user.role === 'photographer') {
      // Photographers can only update orders from their sessions
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
      // Studio admins can update orders from their studio
      whereClause = {
        id,
        studioId: auth.studioId,
      }
    }

    // Get the order first to check payment method
    const existingOrder = await prisma.order.findUnique({
      where: whereClause,
      select: { paymentMethod: true },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only allow manual payment status updates for cash payments
    if (existingOrder.paymentMethod !== 'cash') {
      return NextResponse.json(
        {
          error:
            'Payment status can only be manually updated for cash payments',
        },
        { status: 400 }
      )
    }

    const order = await prisma.order.update({
      where: whereClause,
      data: { paymentStatus },
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
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Update payment status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
