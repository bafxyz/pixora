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
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly' // monthly, weekly, daily

    let dateFormat: string
    let groupBy: string

    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d'
        groupBy = 'day'
        break
      case 'weekly':
        dateFormat = '%Y-%u'
        groupBy = 'week'
        break
      case 'monthly':
      default:
        dateFormat = '%Y-%m'
        groupBy = 'month'
        break
    }

    // Get revenue data over time
    const revenueData = (await prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC(${groupBy}, created_at), '${dateFormat}') as period,
        COALESCE(SUM(final_amount), 0) as revenue,
        COUNT(*) as order_count
      FROM orders 
      WHERE payment_status = 'paid'
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY period
      ORDER BY period ASC
    `) as Array<{ period: string; revenue: number; order_count: number }>

    // Get new studios over time
    const studiosData = (await prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC(${groupBy}, created_at), '${dateFormat}') as period,
        COUNT(*) as count
      FROM studios 
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY period
      ORDER BY period ASC
    `) as Array<{ period: string; count: number }>

    // Get new guests over time
    const guestsData = (await prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC(${groupBy}, created_at), '${dateFormat}') as period,
        COUNT(*) as count
      FROM guests 
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY period
      ORDER BY period ASC
    `) as Array<{ period: string; count: number }>

    // Get photos uploaded over time
    const photosData = (await prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC(${groupBy}, created_at), '${dateFormat}') as period,
        COUNT(*) as count
      FROM photos 
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY period
      ORDER BY period ASC
    `) as Array<{ period: string; count: number }>

    return NextResponse.json({
      revenue: revenueData,
      studios: studiosData,
      guests: guestsData,
      photos: photosData,
    })
  } catch (error) {
    console.error('Charts revenue API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
