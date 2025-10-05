'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card'
import { LoadingScreen } from '@repo/ui/loading-screen'
import { PageContainer } from '@repo/ui/page-container'
import { PageHeader } from '@repo/ui/page-header'
import { StatsCard } from '@repo/ui/stats-card'
import {
  BarChart3,
  Building,
  Monitor,
  Settings,
  ShieldCheck,
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
    return <LoadingScreen message={_(msg`Loading...`)} />
  }

  return (
    <PageContainer>
      <PageHeader
        title={<Trans>Admin Dashboard</Trans>}
        description={<Trans>Platform management and monitoring</Trans>}
      />

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-8">
        <StatsCard
          title={_(msg`Studios`)}
          value={globalStats.totalStudios}
          icon={Building}
          gradient="bg-gradient-to-br from-primary to-indigo-600"
        />
        <StatsCard
          title={_(msg`Guests`)}
          value={globalStats.totalGuests}
          icon={Users}
          gradient="bg-gradient-to-br from-secondary to-pink-600"
        />
        <StatsCard
          title={_(msg`Photos`)}
          value={globalStats.totalPhotos}
          icon={BarChart3}
          gradient="bg-gradient-to-br from-purple-600 to-violet-600"
        />
        <StatsCard
          title={_(msg`Orders`)}
          value={globalStats.totalOrders}
          icon={BarChart3}
          gradient="bg-gradient-to-br from-accent to-amber-600"
        />
        <StatsCard
          title={_(msg`Revenue`)}
          value={`$${globalStats.totalRevenue}`}
          icon={BarChart3}
          gradient="bg-gradient-to-br from-emerald-600 to-green-600"
          className="col-span-2 lg:col-span-1"
        />
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
      </div>
    </PageContainer>
  )
}
