import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Получаем глобальную статистику по всей платформе
    const stats = {
      totalClients: 0,
      totalGuests: 0,
      totalPhotos: 0,
      totalOrders: 0,
      totalRevenue: 0,
    }

    // Считаем клиентов
    const { count: clientsCount, error: clientsError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    if (!clientsError && clientsCount !== null) {
      stats.totalClients = clientsCount
    }

    // Считаем гостей
    const { count: guestsCount, error: guestsError } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })

    if (!guestsError && guestsCount !== null) {
      stats.totalGuests = guestsCount
    }

    // Считаем фото
    const { count: photosCount, error: photosError } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })

    if (!photosError && photosCount !== null) {
      stats.totalPhotos = photosCount
    }

    // Считаем заказы
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    if (!ordersError && ordersCount !== null) {
      stats.totalOrders = ordersCount
    }

    // Считаем общую выручку
    const { data: orders, error: revenueError } = await supabase
      .from('orders')
      .select('total_amount')
      .not('total_amount', 'is', null)

    if (!revenueError && orders) {
      stats.totalRevenue = orders.reduce((sum, order) => {
        return sum + (order.total_amount || 0)
      }, 0)
    }

    return NextResponse.json({
      stats,
    })
  } catch (error) {
    console.error('Super admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
