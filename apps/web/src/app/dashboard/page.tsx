'use client'

import { Button } from '@repo/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import {
  BarChart3,
  Calendar,
  Camera,
  Image as ImageIcon,
  QrCode,
  Settings,
  Upload,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DashboardStats {
  totalPhotos: number
  totalGuests: number
  totalOrders: number
  recentActivity: string[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data - в реальном приложении это будет загружаться из API
  const [stats] = useState<DashboardStats>({
    totalPhotos: 0,
    totalGuests: 0,
    totalOrders: 0,
    recentActivity: [],
  })

  const navigateToPhotographer = () => {
    router.push('/photographer')
  }

  const navigateToAdmin = () => {
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Панель управления
          </h1>
          <p className="text-gray-600">
            Добро пожаловать в систему управления фотогалереей
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="overflow-x-auto">
            <TabsList className="flex h-14 bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-lg p-2 gap-2 min-w-max">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md whitespace-nowrap"
              >
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span>Обзор</span>
              </TabsTrigger>
              <TabsTrigger
                value="quick-actions"
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md whitespace-nowrap"
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span>Действия</span>
              </TabsTrigger>
              <TabsTrigger
                value="recent"
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md whitespace-nowrap"
              >
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Активность</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md whitespace-nowrap"
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span>Настройки</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Всего фотографий
                  </CardTitle>
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPhotos}</div>
                  <p className="text-xs text-muted-foreground">
                    Загружено в систему
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Всего гостей
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalGuests}</div>
                  <p className="text-xs text-muted-foreground">
                    Зарегистрировано в системе
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Заказов</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    Оформлено заказов
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Добро пожаловать!</CardTitle>
                <CardDescription>
                  Выберите роль для продолжения работы
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card
                    className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={navigateToPhotographer}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <Camera className="w-12 h-12 text-blue-600 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Режим фотографа
                      </h3>
                      <p className="text-gray-600 text-center text-sm">
                        Сканирование QR-кодов, создание галерей, загрузка
                        фотографий
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className="border-2 border-dashed border-gray-300 hover:border-green-500 transition-colors cursor-pointer"
                    onClick={navigateToAdmin}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <Settings className="w-12 h-12 text-green-600 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Режим администратора
                      </h3>
                      <p className="text-gray-600 text-center text-sm">
                        Управление гостями, заказами, статистика и настройки
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quick-actions" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/photographer?tab=scan')}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <QrCode className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    Сканировать QR
                  </h3>
                  <p className="text-sm text-gray-600 text-center">
                    Быстро добавить гостя по QR-коду
                  </p>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/photographer?tab=generate')}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <QrCode className="w-8 h-8 text-green-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">Создать QR</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Сгенерировать QR-код для нового гостя
                  </p>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/photographer?tab=guests')}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Upload className="w-8 h-8 text-purple-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    Загрузить фото
                  </h3>
                  <p className="text-sm text-gray-600 text-center">
                    Добавить фотографии для гостей
                  </p>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin')}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Users className="w-8 h-8 text-orange-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    Управление гостями
                  </h3>
                  <p className="text-sm text-gray-600 text-center">
                    Просмотр и редактирование списка гостей
                  </p>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin?tab=orders')}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <BarChart3 className="w-8 h-8 text-red-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">Заказы</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Просмотр и обработка заказов
                  </p>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push('/admin?tab=stats')}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <BarChart3 className="w-8 h-8 text-indigo-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">Статистика</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Аналитика и отчеты
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Последняя активность</CardTitle>
                <CardDescription>
                  События в системе за последнее время
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Нет недавней активности</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Активность появится после начала работы с системой
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity, index) => (
                      <div
                        key={`activity-${index}-${activity}`}
                        className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                          {activity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Настройки системы</CardTitle>
                <CardDescription>
                  Конфигурация и параметры приложения
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Уведомления</h4>
                      <p className="text-sm text-gray-600">
                        Настройка push-уведомлений
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Настроить
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Резервное копирование</h4>
                      <p className="text-sm text-gray-600">
                        Автоматическое сохранение данных
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Настроить
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Интеграции</h4>
                      <p className="text-sm text-gray-600">
                        Подключение внешних сервисов
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Управление
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
