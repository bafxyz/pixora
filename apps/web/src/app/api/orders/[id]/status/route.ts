import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'
import { createNotification } from '@/lib/services/notification.service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check role - admin, studio-admin, or photographer can update order status
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
    const { status } = body

    if (
      !status ||
      !['pending', 'processing', 'completed', 'cancelled'].includes(status)
    ) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Build where clause based on user role
    let whereClause: any = { id }

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

    // Prepare update data based on status
    let updateData: any = { status }

    if (status === 'processing') {
      updateData.processedAt = new Date()
    } else if (status === 'completed') {
      updateData.completedAt = new Date()
      // If not already processed, set processed time
      updateData.processedAt = new Date()
    }

    const order = await prisma.order.update({
      where: whereClause,
      data: updateData,
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

    // Send notification for status change
    try {
      let title = ''
      let message = ''

      switch (status) {
        case 'processing':
          title = 'Order Processing Started'
          message = `Your order ${order.id.slice(0, 8)}... is now being processed. We'll notify you when it's ready.`
          break
        case 'completed':
          title = 'Order Completed'
          message = `Great news! Your order ${order.id.slice(0, 8)}... has been completed. Thank you for your purchase!`
          break
        case 'cancelled':
          title = 'Order Cancelled'
          message = `Your order ${order.id.slice(0, 8)}... has been cancelled. Please contact us if you have any questions.`
          break
      }

      if (title && message) {
        await createNotification({
          type: 'order_status_changed',
          recipientEmail: order.guestEmail,
          orderId: order.id,
          title,
          message,
        })

        // Also notify photographer if order is completed
        if (status === 'completed') {
          await createNotification({
            type: 'new_order',
            recipientEmail: order.photographer.email,
            orderId: order.id,
            title: 'Order Completed',
            message: `Order ${order.id.slice(0, 8)}... for ${order.guestEmail} has been marked as completed.`,
          })
        }
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
      // Don't fail the status update if notification fails
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Update order status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
