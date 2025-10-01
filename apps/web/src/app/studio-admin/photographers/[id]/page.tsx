'use client'

import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
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
import { PageLayout } from '@/shared/components/page-layout'

interface PhotographerDetails {
  id: string
  name: string
  email: string
  phone: string | null
  branding: { brandColor?: string; logoUrl?: string; welcomeMessage?: string }
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
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/studio-admin/photographers')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к списку
          </Button>

          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Имя
                    </span>
                    <p className="text-lg font-semibold">{photographer.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Дата регистрации
                    </span>
                    <p className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(photographer.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Email
                    </span>
                    <p className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {photographer.email}
                    </p>
                  </div>
                  {photographer.phone && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Телефон
                      </span>
                      <p className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {photographer.phone}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Branding Settings */}
            {photographer.branding && (
              <Card>
                <CardHeader>
                  <CardTitle>Настройки брендинга</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Основной цвет
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{
                            backgroundColor:
                              photographer.branding.brandColor || '#000000',
                          }}
                        />
                        <span>
                          {photographer.branding.brandColor || '#000000'}
                        </span>
                      </div>
                    </div>
                    {photographer.branding.logoUrl && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Логотип
                        </span>
                        <p className="text-blue-600 hover:underline cursor-pointer">
                          Просмотреть логотип
                        </p>
                      </div>
                    )}
                  </div>

                  {photographer.branding.welcomeMessage && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Приветственное сообщение
                      </span>
                      <p className="text-sm bg-muted/30 p-3 rounded">
                        {photographer.branding.welcomeMessage}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Statistics */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Статистика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="font-medium">Гости</span>
                  </div>
                  <Badge variant="secondary">{photographer.guestCount}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center">
                    <Camera className="w-5 h-5 mr-2 text-green-600" />
                    <span className="font-medium">Фотографии</span>
                  </div>
                  <Badge variant="secondary">{photographer.photoCount}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2 text-purple-600" />
                    <span className="font-medium">Заказы</span>
                  </div>
                  <Badge variant="secondary">{photographer.orderCount}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Просмотреть гостей
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="w-4 h-4 mr-2" />
                  Просмотреть фото
                </Button>
                <Button variant="outline" className="w-full justify-start">
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
