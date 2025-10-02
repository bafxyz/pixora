'use client'

import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { PageLayout } from '@repo/ui/page-layout'
import {
  ArrowLeft,
  Calendar,
  Camera,
  Edit,
  Loader2,
  Mail,
  Phone,
  ShoppingBag,
  Trash2,
  Users,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface PhotographerDetails {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  guestCount: number
  photoCount: number
  orderCount: number
}

interface RecentActivity {
  id: string
  type: 'guest' | 'photo' | 'order'
  description: string
  createdAt: string
}

export default function PhotographerDetailsPage() {
  const [photographer, setPhotographer] = useState<PhotographerDetails | null>(
    null
  )
  const [_recentActivity, _setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const photographerId = params.id as string

  useEffect(() => {
    const fetchPhotographerDetails = async () => {
      try {
        const response = await fetch(
          `/api/studio-admin/photographers/${photographerId}`
        )
        const data = await response.json()

        if (response.ok) {
          setPhotographer(data.photographer)
        } else {
          console.error('Failed to fetch photographer details:', data.error)
          toast.error('Ошибка при загрузке данных фотографа')
          router.push('/studio-admin/photographers')
        }
      } catch (error) {
        console.error('Error fetching photographer details:', error)
        toast.error('Ошибка при загрузке данных фотографа')
        router.push('/studio-admin/photographers')
      } finally {
        setLoading(false)
      }
    }

    if (photographerId) {
      fetchPhotographerDetails()
    }
  }, [photographerId, router])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleDelete = async () => {
    if (
      !photographer ||
      !confirm('Вы уверены, что хотите удалить этого фотографа?')
    ) {
      return
    }

    try {
      const response = await fetch(
        `/api/studio-admin/photographers/${photographerId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        toast.success('Фотограф удален успешно')
        router.push('/studio-admin/photographers')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Ошибка при удалении фотографа')
      }
    } catch (error) {
      console.error('Error deleting photographer:', error)
      toast.error('Ошибка при удалении фотографа')
    }
  }

  if (loading) {
    return (
      <PageLayout
        title="Детали фотографа"
        description="Просмотр подробной информации о фотографе"
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (!photographer) {
    return (
      <PageLayout
        title="Фотограф не найден"
        description="Запрашиваемый фотограф не существует"
      >
        <div className="text-center py-16">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Фотограф не найден
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Возможно, фотограф был удален или вы указали неверный ID
          </p>
          <Button onClick={() => router.push('/studio-admin/photographers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться к списку
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={`Фотограф: ${photographer.name}`}
      description="Подробная информация о фотографе и его деятельности"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/studio-admin/photographers')}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к списку
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/studio-admin/photographers/${photographerId}/edit`
                )
              }
              className="w-full sm:w-auto"
            >
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Имя
                    </span>
                    <p className="text-lg font-semibold break-words">
                      {photographer.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Дата регистрации
                    </span>
                    <p className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="break-words">
                        {formatDate(photographer.createdAt)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Email
                    </span>
                    <p className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="break-words text-sm">
                        {photographer.email}
                      </span>
                    </p>
                  </div>
                  {photographer.phone && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Телефон
                      </span>
                      <p className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="break-words">
                          {photographer.phone}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Статистика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center min-w-0">
                    <Users className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                    <span className="font-medium truncate">Гости</span>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {photographer.guestCount}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center min-w-0">
                    <Camera className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" />
                    <span className="font-medium truncate">Фотографии</span>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {photographer.photoCount}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center min-w-0">
                    <ShoppingBag className="w-5 h-5 mr-2 text-purple-600 flex-shrink-0" />
                    <span className="font-medium truncate">Заказы</span>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {photographer.orderCount}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(
                      `/studio-admin/photographers/${photographerId}/guests`
                    )
                  }
                >
                  <Users className="w-4 h-4 mr-2" />
                  Просмотреть гостей
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(
                      `/studio-admin/photographers/${photographerId}/photos`
                    )
                  }
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Просмотреть фото
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(
                      `/studio-admin/photographers/${photographerId}/orders`
                    )
                  }
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Просмотреть заказы
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
