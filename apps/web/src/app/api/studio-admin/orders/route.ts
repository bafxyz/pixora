import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

export async function GET(request: NextRequest) {
  // Check studio-admin or admin role
  const auth = await withRoleCheck(['studio-admin', 'admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    // For studio-admin use their client_id, for admin - from header or all
    let clientId = auth.clientId

    // If admin and x-client-id is provided, use it
    if (auth.user.role === 'admin') {
      const headerClientId = request.headers.get('x-client-id')
      if (headerClientId) {
        clientId = headerClientId
      }
    }

    if (!clientId && auth.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Get orders for this client (or all for super-admin)
    const orders = await prisma.order.findMany({
      where: clientId
        ? {
            clientId: clientId,
          }
        : {},
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
  // Check studio-admin or admin role
  const auth = await withRoleCheck(['studio-admin', 'admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    // For studio-admin use their client_id
    const clientId = auth.clientId

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

    // Update order status (check client_id only for admin)
    const whereClause =
      auth.user.role === 'admin'
        ? { id: orderId }
        : { id: orderId, clientId: clientId }

    const updatedOrder = await prisma.order.updateMany({
      where: whereClause,
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
