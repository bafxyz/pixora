'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
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
import { PageLayout } from '@/shared/components/page-layout'

interface StudioStats {
  totalGuests: number
  totalPhotos: number
  totalOrders: number
  revenue: number
}

export default function StudioAdminStatsPage() {
  const [stats, setStats] = useState<StudioStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/studio-admin/stats')
        const data = await response.json()

        if (response.ok) {
          setStats(data.stats)
        } else {
          console.error('Failed to fetch stats:', data.error)
          toast.error('Ошибка при загрузке статистики')
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
        toast.error('Ошибка при загрузке статистики')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <PageLayout
        title="Статистика студии"
        description="Аналитика и метрики работы студии"
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Статистика студии"
      description="Аналитика и метрики работы студии"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Guests Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Всего гостей
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalGuests || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Уникальных посетителей
              </p>
            </CardContent>
          </Card>

          {/* Total Photos Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего фото</CardTitle>
              <Image className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalPhotos || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Загружено за всё время
              </p>
            </CardContent>
          </Card>

          {/* Total Orders Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Всего заказов
              </CardTitle>
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalOrders || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Обработано заказов
              </p>
            </CardContent>
          </Card>

          {/* Revenue Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Доход</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.revenue ? stats.revenue.toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Общий заработок</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Charts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Аналитика по заказам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                {/* Placeholder for chart - in a real implementation, you would use a charting library like recharts */}
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm">График заказов за последние 30 дней</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Подключите библиотеку для визуализации данных
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
                Последние события
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Новый заказ</p>
                    <p className="text-xs text-muted-foreground">
                      Заказ #12345 оформлен клиентом
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Фото загружено</p>
                    <p className="text-xs text-muted-foreground">
                      25 новых фото добавлено в галерею
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Гость зарегистрирован</p>
                    <p className="text-xs text-muted-foreground">
                      Новый гость добавлен в систему
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Заказ завершен</p>
                    <p className="text-xs text-muted-foreground">
                      Заказ #12344 успешно выполнен
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
              <p className="text-sm text-muted-foreground">Фото на заказ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {stats?.totalOrders
                  ? (stats.revenue / stats.totalOrders).toFixed(2)
                  : '0.00'}
              </div>
              <p className="text-sm text-muted-foreground">Средний чек ($)</p>
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
              <p className="text-sm text-muted-foreground">Конверсия (%)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
