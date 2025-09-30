import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma/client';
import { withRoleCheck } from '@/shared/lib/auth/role-guard';

export async function GET(request: NextRequest) {
  // Check admin role
  const auth = await withRoleCheck(['admin'], request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {

    // Get counts for various entities
    const [
      totalClients,
      totalPhotographers,
      totalSessions,
      totalPhotos,
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      totalRevenue,
      pendingPayments,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.photographer.count(),
      prisma.photoSession.count(),
      prisma.photo.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'processing' } }),
      prisma.order.count({ where: { status: 'completed' } }),
      prisma.order.aggregate({
        _sum: { finalAmount: true },
        where: { paymentStatus: 'paid' },
      }),
      prisma.order.aggregate({
        _sum: { finalAmount: true },
        where: { paymentStatus: 'pending' },
      }),
    ]);

    // Get recent orders with activity
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        photographer: { select: { email: true, name: true } },
        session: { select: { name: true } },
      },
    });

    // Transform orders into log entries
    const logs = recentOrders.map((order) => ({
      id: order.id,
      timestamp: order.createdAt,
      level: order.paymentStatus === 'failed' ? 'error' :
             order.paymentStatus === 'pending' ? 'warning' : 'info',
      category: 'Orders',
      message: `${order.status.toUpperCase()} - ${order.session.name} - $${order.finalAmount}`,
      user: order.guestEmail,
    }));

    // Calculate resource usage metrics (simulated for now)
    const activeConnections = pendingOrders + processingOrders;

    return NextResponse.json({
      health: {
        status: 'healthy',
        activeConnections,
      },
      stats: {
        totalClients,
        totalPhotographers,
        totalSessions,
        totalPhotos,
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        totalRevenue: Number(totalRevenue._sum.finalAmount || 0),
        pendingPayments: Number(pendingPayments._sum.finalAmount || 0),
      },
      logs,
    });
  } catch (error) {
    console.error('Monitoring API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}