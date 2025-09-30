'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  BarChart3,
  Building,
  Camera,
  Download,
  FileImage,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react'
import { PageLayout } from '@/shared/components/page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface PlatformStats {
  totalClients: number
  totalGuests: number
  totalPhotos: number
  totalOrders: number
  totalRevenue: number
}

interface DetailedStats {
  clientsGrowth: { month: string; count: number }[]
  topClients: {
    id: string
    name: string
    photographersCount: number
    photosCount: number
    sessionsCount: number
  }[]
  revenueByMonth: { month: string; revenue: number }[]
}

export default function AdminStatsPage() {
  const { _ } = useLingui()
  const [stats, setStats] = useState<PlatformStats>({
    totalClients: 0,
    totalGuests: 0,
    totalPhotos: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [topClients, setTopClients] = useState<DetailedStats['topClients']>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true)
      const [statsResponse, clientsResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/clients'),
      ])

      if (statsResponse.ok) {
        const data = await statsResponse.json()
        setStats(data.stats || stats)
      }

      if (clientsResponse.ok) {
        const data = await clientsResponse.json()
        const sorted = [...(data.clients || [])].sort(
          (a, b) =>
            b.photosCount + b.sessionsCount - (a.photosCount + a.sessionsCount)
        )
        setTopClients(sorted.slice(0, 5))
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error(_(msg`Failed to load statistics`))
    } finally {
      setIsLoading(false)
    }
  }, [_, stats])

  useEffect(() => {
    loadStats()
  }, [])

  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      platformStats: stats,
      topClients: topClients,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pixora-stats-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(_(msg`Statistics exported successfully`))
  }

  if (isLoading) {
    return (
      <PageLayout
        title={_(msg`Platform Statistics`)}
        description={_(msg`Overall statistics for all studios and users`)}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">
              <Trans>Loading statistics...</Trans>
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={_(msg`Platform Statistics`)}
      description={_(msg`Overall statistics for all studios and users`)}
      action={{
        label: _(msg`Export Report`),
        onClick: handleExport,
        icon: <Download className="w-4 h-4" />,
      }}
    >
      <div className="space-y-6">
        {/* Main Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    <Trans>Clients</Trans>
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {stats.totalClients}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    <Trans>Guests</Trans>
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {stats.totalGuests}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                  <FileImage className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    <Trans>Photos</Trans>
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {stats.totalPhotos.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    <Trans>Orders</Trans>
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {stats.totalOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    <Trans>Revenue</Trans>
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    ${stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <Trans>Average per Client</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  <Trans>Photos per client</Trans>
                </span>
                <Badge variant="secondary">
                  {stats.totalClients > 0
                    ? Math.round(stats.totalPhotos / stats.totalClients)
                    : 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  <Trans>Guests per client</Trans>
                </span>
                <Badge variant="secondary">
                  {stats.totalClients > 0
                    ? Math.round(stats.totalGuests / stats.totalClients)
                    : 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  <Trans>Revenue per client</Trans>
                </span>
                <Badge variant="secondary">
                  $
                  {stats.totalClients > 0
                    ? Math.round(stats.totalRevenue / stats.totalClients)
                    : 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <Trans>Order Metrics</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  <Trans>Average order value</Trans>
                </span>
                <Badge variant="secondary">
                  $
                  {stats.totalOrders > 0
                    ? Math.round(stats.totalRevenue / stats.totalOrders)
                    : 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  <Trans>Photos per order</Trans>
                </span>
                <Badge variant="secondary">
                  {stats.totalOrders > 0
                    ? Math.round(stats.totalPhotos / stats.totalOrders)
                    : 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  <Trans>Conversion rate</Trans>
                </span>
                <Badge variant="secondary">
                  {stats.totalGuests > 0
                    ? ((stats.totalOrders / stats.totalGuests) * 100).toFixed(
                        1
                      )
                    : 0}
                  %
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <Trans>Platform Health</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  <Trans>Active clients</Trans>
                </span>
                <Badge variant="secondary">{stats.totalClients}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  <Trans>Total storage (photos)</Trans>
                </span>
                <Badge variant="secondary">
                  {(stats.totalPhotos * 3.5).toFixed(0)} MB
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  <Trans>Platform status</Trans>
                </span>
                <Badge className="bg-green-500">
                  <Trans>Healthy</Trans>
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Clients */}
        {topClients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                <Trans>Top 5 Clients by Activity</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients.map((client, index) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {client.name}
                        </p>
                        <div className="flex gap-4 text-sm text-slate-500 mt-1">
                          <span>
                            {client.photographersCount}{' '}
                            <Trans>photographers</Trans>
                          </span>
                          <span>
                            {client.sessionsCount} <Trans>sessions</Trans>
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg">
                      {client.photosCount.toLocaleString()}{' '}
                      <Trans>photos</Trans>
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
