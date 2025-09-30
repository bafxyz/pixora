import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(request: NextRequest) {
  // Check admin role
  const auth = await withRoleCheck(['admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    // Get platform statistics using real data
    const [
      totalClients,
      totalPhotographers,
      totalPhotos,
      totalOrders,
      totalRevenue,
      uniqueGuests,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.photographer.count(),
      prisma.photo.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { finalAmount: true },
        where: { paymentStatus: 'paid' },
      }),
      prisma.order.groupBy({
        by: ['guestEmail'],
      }),
    ])

    return NextResponse.json({
      stats: {
        totalClients,
        totalPhotographers,
        totalPhotos,
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.finalAmount || 0),
        totalGuests: uniqueGuests.length,
      },
    })
  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
