'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { PageLayout } from '@repo/ui/page-layout'
import {
  Activity,
  BarChart3,
  DollarSign,
  Image,
  Loader2,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface StudioStats {
  totalGuests: number
  totalPhotos: number
  totalOrders: number
  revenue: number
  photographersCount: number
  sessionsCount: number
}

export default function StudioAdminStatsPage() {
  const { _ } = useLingui()
  const [stats, setStats] = useState<StudioStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/studio-admin/stats')

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Failed to fetch stats:', response.status, errorText)
          toast.error(_(msg`Error loading statistics`))
          return
        }

        const data = await response.json()
        setStats(data.stats)
      } catch (error) {
        console.error('Error fetching stats:', error)
        toast.error(_(msg`Error loading statistics`))
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [_])

  if (loading) {
    return (
      <PageLayout
        title={_(msg`Studio Statistics`)}
        description={_(msg`Analytics and metrics for your studio`)}
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={_(msg`Studio Statistics`)}
      description={_(msg`Analytics and metrics for your studio`)}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Guests Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Trans>Total Guests</Trans>
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalGuests || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                <Trans>Unique visitors</Trans>
              </p>
            </CardContent>
          </Card>

          {/* Total Photos Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Trans>Total Photos</Trans>
              </CardTitle>
              <Image className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalPhotos || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                <Trans>Uploaded all time</Trans>
              </p>
            </CardContent>
          </Card>

          {/* Total Orders Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Trans>Total Orders</Trans>
              </CardTitle>
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalOrders || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                <Trans>Orders processed</Trans>
              </p>
            </CardContent>
          </Card>

          {/* Revenue Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Trans>Revenue</Trans>
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.revenue ? stats.revenue.toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                <Trans>Total earnings</Trans>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Charts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <Trans>Order Analytics</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                {/* Placeholder for chart - in a real implementation, you would use a charting library like recharts */}
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm">
                    <Trans>Orders chart for the last 30 days</Trans>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Trans>Connect a data visualization library</Trans>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                <Trans>Recent Activity</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">
                      <Trans>New Order</Trans>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <Trans>Order #12345 placed by customer</Trans>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">
                      <Trans>Photos Uploaded</Trans>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <Trans>25 new photos added to gallery</Trans>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">
                      <Trans>Guest Registered</Trans>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <Trans>New guest added to system</Trans>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">
                      <Trans>Order Completed</Trans>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <Trans>Order #12344 successfully completed</Trans>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {stats?.totalOrders
                  ? (stats.totalPhotos / stats.totalOrders).toFixed(1)
                  : '0.0'}
              </div>
              <p className="text-sm text-muted-foreground">
                <Trans>Photos per Order</Trans>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {stats?.totalOrders
                  ? (stats.revenue / stats.totalOrders).toFixed(2)
                  : '0.00'}
              </div>
              <p className="text-sm text-muted-foreground">
                <Trans>Average Order ($)</Trans>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {stats?.totalOrders && stats?.totalGuests
                  ? ((stats.totalOrders / stats.totalGuests) * 100).toFixed(1)
                  : '0.0'}
                %
              </div>
              <p className="text-sm text-muted-foreground">
                <Trans>Conversion (%)</Trans>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
