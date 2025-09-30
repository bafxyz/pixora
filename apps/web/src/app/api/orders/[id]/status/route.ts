import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma/client';
import { createClient } from '@/shared/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Find photographer
    const photographer = await prisma.photographer.findUnique({
      where: { email: user.email },
    });

    if (!photographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to photographer
    const order = await prisma.order.findFirst({
      where: {
        id,
        photographerId: photographer.id,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    const updateData: any = { status };

    if (status === 'processing' && !order.processedAt) {
      updateData.processedAt = new Date();
    }

    if (status === 'completed' && !order.completedAt) {
      updateData.completedAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}