import type { OrderStatus } from '@prisma/client'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Get client_id from request headers (set by middleware)
    const clientId = request.headers.get('x-client-id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 401 }
      )
    }

    // Get orders for this client
    const orders = await prisma.order.findMany({
      where: {
        clientId: clientId,
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        photographer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get client_id from request headers
    const clientId = request.headers.get('x-client-id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update order status
    const updatedOrder = await prisma.order.updateMany({
      where: {
        id: orderId,
        clientId: clientId,
      },
      data: {
        status: status as OrderStatus,
      },
    })

    if (updatedOrder.count === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get the updated order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        photographer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
