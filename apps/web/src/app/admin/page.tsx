'use client'

import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { Button } from '@repo/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card'
import {
  BarChart3,
  Building,
  Monitor,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface GlobalStats {
  totalStudios: number
  totalGuests: number
  totalPhotos: number
  totalOrders: number
  totalRevenue: number
}

export default function AdminPage() {
  const { _ } = useLingui()
  const router = useRouter()
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalStudios: 0,
    totalGuests: 0,
    totalPhotos: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const statsResponse = await fetch('/api/admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setGlobalStats(
          statsData.stats || {
            totalStudios: 0,
            totalGuests: 0,
            totalPhotos: 0,
            totalOrders: 0,
            totalRevenue: 0,
          }
        )
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            <Trans>Loading...</Trans>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            <Trans>Admin Dashboard</Trans>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            <Trans>Platform management and monitoring</Trans>
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-slate-600 truncate">
                    <Trans>Studios</Trans>
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-800">
                    {globalStats.totalStudios}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-secondary to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-slate-600 truncate">
                    <Trans>Guests</Trans>
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-800">
                    {globalStats.totalGuests}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-slate-600 truncate">
                    <Trans>Photos</Trans>
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-800">
                    {globalStats.totalPhotos}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-accent to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-slate-600 truncate">
                    <Trans>Orders</Trans>
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-800">
                    {globalStats.totalOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 col-span-2 lg:col-span-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-slate-600 truncate">
                    <Trans>Revenue</Trans>
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-800">
                    ${globalStats.totalRevenue}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/admin/studios')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-lg">
                  <Trans>Studio Management</Trans>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                <Trans>Create, manage and monitor photo studios</Trans>
              </CardDescription>
              <Button className="w-full" variant="outline">
                <Trans>Manage Studios</Trans>
              </Button>
            </CardContent>
          </Card>

          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/admin/studio-admins')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-lg">
                  <Trans>Studio Admins</Trans>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                <Trans>Create and manage studio administrator accounts</Trans>
              </CardDescription>
              <Button className="w-full" variant="outline">
                <Trans>Manage Studio Admins</Trans>
              </Button>
            </CardContent>
          </Card>

          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/admin/stats')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-lg">
                  <Trans>Platform Analytics</Trans>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                <Trans>
                  View detailed platform statistics and performance metrics
                </Trans>
              </CardDescription>
              <Button className="w-full" variant="outline">
                <Trans>View Analytics</Trans>
              </Button>
            </CardContent>
          </Card>

          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/admin/system')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-amber-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-lg">
                  <Trans>System Settings</Trans>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                <Trans>Configure platform settings, pricing and features</Trans>
              </CardDescription>
              <Button className="w-full" variant="outline">
                <Trans>System Config</Trans>
              </Button>
            </CardContent>
          </Card>

          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/admin/monitoring')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-lg flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-lg">
                  <Trans>Monitoring & Logs</Trans>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                <Trans>
                  Monitor system health, security logs and performance
                </Trans>
              </CardDescription>
              <Button className="w-full" variant="outline">
                <Trans>View Monitoring</Trans>
              </Button>
            </CardContent>
          </Card>

          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/admin/orders')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-lg">
                  <Trans>Orders Management</Trans>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                <Trans>
                  View and manage orders, update statuses and track payments
                </Trans>
              </CardDescription>
              <Button className="w-full" variant="outline">
                <Trans>Manage Orders</Trans>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
