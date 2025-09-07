import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

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
    const { count: guestsCount, error: guestsError } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)

    if (!guestsError && guestsCount !== null) {
      stats.totalGuests = guestsCount
    }

    // Считаем фото
    const { count: photosCount, error: photosError } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)

    if (!photosError && photosCount !== null) {
      stats.totalPhotos = photosCount
    }

    // Считаем заказы
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)

    if (!ordersError && ordersCount !== null) {
      stats.totalOrders = ordersCount
    }

    // Считаем выручку
    const { data: orders, error: revenueError } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('client_id', clientId)
      .not('total_amount', 'is', null)

    if (!revenueError && orders) {
      stats.revenue = orders.reduce((sum, order) => {
        return sum + (order.total_amount || 0)
      }, 0)
    }

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
