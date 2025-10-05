'use client'

import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
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
  Calendar,
  Camera,
  DollarSign,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface Stats {
  totalGuests: number
  totalPhotos: number
  totalOrders: number
  revenue: number
  photographersCount?: number
  sessionsCount?: number
}

export default function StudioAdminPage() {
  const { _ } = useLingui()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalGuests: 0,
    totalPhotos: 0,
    totalOrders: 0,
    revenue: 0,
    photographersCount: 0,
    sessionsCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const statsResponse = await fetch('/api/studio-admin/stats')
      if (statsResponse.ok) {
        const response = await statsResponse.json()
        setStats(
          response.stats || {
            totalGuests: 0,
            totalPhotos: 0,
            totalOrders: 0,
            revenue: 0,
            photographersCount: 0,
            sessionsCount: 0,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            <Trans>Studio Dashboard</Trans>
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            <Trans>Manage your photography studio</Trans>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.totalGuests}
                </p>
                <p className="text-xs text-slate-600">
                  <Trans>Guests</Trans>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Camera className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.totalPhotos}
                </p>
                <p className="text-xs text-slate-600">
                  <Trans>Photos</Trans>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.totalOrders}
                </p>
                <p className="text-xs text-slate-600">
                  <Trans>Orders</Trans>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  ${stats.revenue}
                </p>
                <p className="text-xs text-slate-600">
                  <Trans>Revenue</Trans>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.photographersCount || 0}
                </p>
                <p className="text-xs text-slate-600">
                  <Trans>Photographers</Trans>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-8 h-8 text-pink-600" />
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.sessionsCount || 0}
                </p>
                <p className="text-xs text-slate-600">
                  <Trans>Sessions</Trans>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/studio-admin/photographers')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">
                  <Trans>Photographers</Trans>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                <Trans>Manage photographers, add new team members</Trans>
              </CardDescription>
              <Button className="w-full" variant="outline">
                <Trans>Manage Photographers</Trans>
              </Button>
            </CardContent>
          </Card>

          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/studio-admin/sessions')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">
                  <Trans>Photo Sessions</Trans>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                <Trans>View and manage all photo sessions</Trans>
              </CardDescription>
              <Button className="w-full" variant="outline">
                <Trans>View Sessions</Trans>
              </Button>
            </CardContent>
          </Card>

          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/studio-admin/stats')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">
                  <Trans>Analytics</Trans>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                <Trans>View detailed statistics and reports</Trans>
              </CardDescription>
              <Button className="w-full" variant="outline">
                <Trans>View Analytics</Trans>
              </Button>
            </CardContent>
          </Card>

          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/studio-admin/orders')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-amber-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">
                  <Trans>Orders</Trans>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                <Trans>View and manage studio orders</Trans>
              </CardDescription>
              <Button className="w-full" variant="outline">
                <Trans>Manage Orders</Trans>
              </Button>
            </CardContent>
          </Card>

          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/studio-admin/settings')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">
                  <Trans>Settings</Trans>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4"></CardDescription>
              <Button className="w-full" variant="outline">
                <Trans>Studio Settings</Trans>
              </Button>
            </CardContent>
          </Card>

          <Card
            className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            onClick={() => router.push('/photographer')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">
                  <Trans>Photographer Mode</Trans>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                <Trans>Switch to photographer tools and upload photos</Trans>
              </CardDescription>
              <Button className="w-full" variant="outline">
                <Trans>Go to Photographer</Trans>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
