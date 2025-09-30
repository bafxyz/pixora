import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma/client';
import { createClient } from '@/shared/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');

    // Check user role
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userRole = authUser?.user_metadata?.role;

    let whereClause: any = {
      ...(status && { status: status as any }),
      ...(paymentStatus && { paymentStatus: paymentStatus as any }),
    };

    // Role-based filtering
    if (userRole === 'photographer') {
      // Photographer sees only their orders
      const photographer = await prisma.photographer.findUnique({
        where: { email: user.email },
      });

      if (!photographer) {
        return NextResponse.json(
          { error: 'Photographer not found' },
          { status: 404 }
        );
      }

      whereClause.photographerId = photographer.id;
    } else if (userRole === 'studio-admin') {
      // Studio admin sees orders from their client's photographers
      const photographer = await prisma.photographer.findUnique({
        where: { email: user.email },
        select: { clientId: true },
      });

      if (photographer) {
        // Get all photographers from this client
        const clientPhotographers = await prisma.photographer.findMany({
          where: { clientId: photographer.clientId },
          select: { id: true },
        });

        whereClause.photographerId = {
          in: clientPhotographers.map(p => p.id),
        };
      }
    }
    // Admin sees all orders (no filter)

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        session: {
          select: {
            name: true,
            scheduledAt: true,
          },
        },
        items: {
          include: {
            photo: {
              select: {
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
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}