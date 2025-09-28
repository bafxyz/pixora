import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { createClient } from '@/shared/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Check admin role
  const auth = await withRoleCheck(['admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const supabase = await createClient()

    // Get global platform statistics
    const stats = {
      totalClients: 0,
      totalGuests: 0,
      totalPhotos: 0,
      totalOrders: 0,
      totalRevenue: 0,
    }

    // Count clients
    const { count: clientsCount, error: clientsError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    if (!clientsError && clientsCount !== null) {
      stats.totalClients = clientsCount
    }

    // Count guests
    const { count: guestsCount, error: guestsError } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })

    if (!guestsError && guestsCount !== null) {
      stats.totalGuests = guestsCount
    }

    // Count photos
    const { count: photosCount, error: photosError } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })

    if (!photosError && photosCount !== null) {
      stats.totalPhotos = photosCount
    }

    // Count orders
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    if (!ordersError && ordersCount !== null) {
      stats.totalOrders = ordersCount
    }

    // Calculate total revenue
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
    console.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
