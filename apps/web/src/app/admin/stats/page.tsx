'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { LoadingScreen } from '@repo/ui/loading-screen'
import { PageLayout } from '@repo/ui/page-layout'
import {
  BarChart3,
  Building,
  Download,
  FileImage,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface PlatformStats {
  totalStudios: number
  totalPhotographers: number
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

interface ChartData {
  revenue: Array<{ period: string; revenue: number; order_count: number }>
  studios: Array<{ period: string; count: number }>
  guests: Array<{ period: string; count: number }>
  photos: Array<{ period: string; count: number }>
}

export default function AdminStatsPage() {
  const { _ } = useLingui()
  const [stats, setStats] = useState<PlatformStats>({
    totalStudios: 0,
    totalPhotographers: 0,
    totalGuests: 0,
    totalPhotos: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [topClients, setTopClients] = useState<DetailedStats['topClients']>([])
  const [chartData, setChartData] = useState<ChartData>({
    revenue: [],
    studios: [],
    guests: [],
    photos: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true)
      const [statsResponse, clientsResponse, chartsResponse] =
        await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/clients'),
          fetch('/api/admin/charts/revenue?period=monthly'),
        ])

      if (statsResponse.ok) {
        const data = await statsResponse.json()
        setStats(data.stats)
      }

      if (clientsResponse.ok) {
        const data = await clientsResponse.json()
        const sorted = [...(data.clients || [])].sort(
          (a, b) =>
            b.photosCount + b.sessionsCount - (a.photosCount + a.sessionsCount)
        )
        setTopClients(sorted.slice(0, 5))
      }

      if (chartsResponse.ok) {
        const data = await chartsResponse.json()
        setChartData(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error(_(msg`Failed to load statistics`))
    } finally {
      setIsLoading(false)
    }
  }, [_])

  useEffect(() => {
    loadStats()
  }, [loadStats])

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
    return <LoadingScreen message={_(msg`Loading statistics...`)} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                    {stats.totalStudios}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    <Trans>Photographers</Trans>
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {stats.totalPhotographers}
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
                  <Trans>Photos per studio</Trans>
                </span>
                <Badge variant="secondary">
                  {stats.totalStudios > 0
                    ? Math.round(stats.totalPhotos / stats.totalStudios)
                    : 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  <Trans>Guests per studio</Trans>
                </span>
                <Badge variant="secondary">
                  {stats.totalStudios > 0
                    ? Math.round(stats.totalGuests / stats.totalStudios)
                    : 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  <Trans>Revenue per studio</Trans>
                </span>
                <Badge variant="secondary">
                  $
                  {stats.totalStudios > 0
                    ? Math.round(stats.totalRevenue / stats.totalStudios)
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
                    ? ((stats.totalOrders / stats.totalGuests) * 100).toFixed(1)
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
                  <Trans>Active studios</Trans>
                </span>
                <Badge variant="secondary">{stats.totalStudios}</Badge>
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <Trans>Revenue Over Time</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value + '-01')
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        year: '2-digit',
                      })
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `¥${value}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `¥${value.toLocaleString()}`,
                      'Revenue',
                    ]}
                    labelFormatter={(label) => {
                      const date = new Date(label + '-01')
                      return date.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <Trans>Platform Growth</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.studios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value + '-01')
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        year: '2-digit',
                      })
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(label) => {
                      const date = new Date(label + '-01')
                      return date.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="New Studios" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Guests & Photos Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <Trans>Guests & Photos Growth</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.guests}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value + '-01')
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        year: '2-digit',
                      })
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(label) => {
                      const date = new Date(label + '-01')
                      return date.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    name="New Guests"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Photos Upload Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                <Trans>Photos Uploaded</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.photos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value + '-01')
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        year: '2-digit',
                      })
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(label) => {
                      const date = new Date(label + '-01')
                      return date.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#f59e0b" name="Photos Uploaded" />
                </BarChart>
              </ResponsiveContainer>
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
