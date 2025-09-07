import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Получаем client_id из заголовков
    const clientId = request.headers.get('x-client-id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 401 }
      )
    }

    // Получаем статистику для клиента
    const stats = {
      totalGuests: 0,
      totalPhotos: 0,
      totalOrders: 0,
      revenue: 0,
    }

    // Считаем гостей
    stats.totalGuests = await prisma.guest.count({
      where: { clientId },
    })

    // Считаем фото
    stats.totalPhotos = await prisma.photo.count({
      where: { clientId },
    })

    // Считаем заказы
    stats.totalOrders = await prisma.order.count({
      where: { clientId },
    })

    // Считаем выручку
    const orders = await prisma.order.findMany({
      where: {
        clientId,
        totalAmount: { not: null },
      },
      select: { totalAmount: true },
    })

    stats.revenue = orders.reduce((sum, order) => {
      return sum + (order.totalAmount || 0)
    }, 0)

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
