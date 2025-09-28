import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

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

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Get statistics for client
    const stats = {
      totalGuests: 0,
      totalPhotos: 0,
      totalOrders: 0,
      revenue: 0,
    }

    // Count guests
    stats.totalGuests = await prisma.guest.count({
      where: { clientId },
    })

    // Count photos
    stats.totalPhotos = await prisma.photo.count({
      where: { clientId },
    })

    // Count orders
    stats.totalOrders = await prisma.order.count({
      where: { clientId },
    })

    // Calculate revenue
    const orders = await prisma.order.findMany({
      where: {
        clientId,
        totalAmount: { not: null },
      },
      select: { totalAmount: true },
    })

    stats.revenue = orders.reduce(
      (sum: number, order: { totalAmount: number | null }) => {
        return sum + (order.totalAmount || 0)
      },
      0
    )

    return NextResponse.json({
      stats,
      clientId,
    })
  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
