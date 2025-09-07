'use client'

import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import {
  Camera,
  Eye,
  Image as ImageIcon,
  LogOut,
  Palette,
  Settings,
  ShoppingCart,
  Upload,
} from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { env } from '@/shared/config/env'
import { createClient } from '@/shared/lib/supabase/client'
import { useAuthStore } from '@/shared/stores/auth.store'

const supabase = createClient()

import { ImageWithFallback } from '@/features/gallery/components/image-with-fallback'
import { PhotoUpload } from './photo-upload'

interface User {
  id: string
  email: string
  user_metadata: {
    role: string
    studioName?: string
    firstName?: string
    lastName?: string
  }
}

interface PhotographerDashboardProps {
  user: User
  onGuestPreview: (guestId: string) => void
}

interface PhotographerProfile {
  id: string
  email: string
  studioName: string
  firstName: string
  lastName: string
  settings: {
    brandColor: string
    logoUrl: string
    welcomeMessage: string
  }
}

interface Order {
  id: string
  guestId: string
  status: string
  totalAmount: number
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}

export function PhotographerDashboard({
  user,
  onGuestPreview,
}: PhotographerDashboardProps) {
  const signOut = useAuthStore((state) => state.signOut)
  const [activeTab, setActiveTab] = useState('upload')
  const [profile, setProfile] = useState<PhotographerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])

  // Форма настроек
  const [settingsForm, setSettingsForm] = useState({
    brandColor: '#3B82F6',
    logoUrl: '',
    welcomeMessage: '',
  })

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token
  }, [])

  // Загрузка профиля
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(
          `${env.supabase.url}/functions/v1/make-server-2e5a4e91/photographer/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${env.supabase.anonKey}`,
            },
          }
        )

        if (response.ok) {
          const profileData = await response.json()
          setProfile(profileData)
          setSettingsForm({
            brandColor: profileData.settings?.brandColor || '#3B82F6',
            logoUrl: profileData.settings?.logoUrl || '',
            welcomeMessage:
              profileData.settings?.welcomeMessage ||
              `Добро пожаловать в ${profileData.studioName}!`,
          })
        }
      } catch (error) {
        console.error('Profile loading error:', error)
      }
    }

    loadProfile()
  }, [user.id])

  // Загрузка заказов
  const loadOrders = useCallback(async () => {
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(
        `${env.supabase.url}/functions/v1/make-server-2e5a4e91/photographer-orders`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const result = await response.json()
        setOrders(result.orders)
      }
    } catch (error) {
      console.error('Orders loading error:', error)
    }
  }, [getAccessToken])

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders()
    }
  }, [activeTab, loadOrders])

  // Обновление настроек брендинга
  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const accessToken = await getAccessToken()

      const response = await fetch(
        `${env.supabase.url}/functions/v1/make-server-2e5a4e91/update-branding`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(settingsForm),
        }
      )

      if (response.ok) {
        alert('Настройки успешно обновлены')
        // Перезагружаем профиль
        if (profile) {
          setProfile({
            ...profile,
            settings: settingsForm,
          })
        }
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      console.error('Settings update error:', error)
      alert('Ошибка при обновлении настроек')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Camera
                className="w-8 h-8"
                style={{ color: profile?.settings?.brandColor || '#3B82F6' }}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.studioName || 'Pixora Studio'}
                </h1>
                <p className="text-gray-600">
                  {profile?.firstName} {profile?.lastName}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => signOut()}>
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Загрузка
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Заказы
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <PhotoUpload
                onUploadComplete={async (urls, guestId) => {
                  try {
                    // Save uploaded photo URLs to database
                    const response = await fetch('/api/photos/save', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        guestId,
                        photoUrls: urls,
                      }),
                    })

                    if (response.ok) {
                      const result = await response.json()
                      alert(
                        `Successfully uploaded and saved ${result.count} photos for guest ${guestId}!`
                      )
                    } else {
                      const error = await response.json()
                      throw new Error(error.error || 'Failed to save photos')
                    }
                  } catch (error) {
                    console.error('Save photos error:', error)
                    alert(
                      `Upload successful but failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`
                    )
                  }
                }}
                onUploadError={(error) => {
                  alert(`Upload failed: ${error}`)
                }}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Guest Gallery Preview</CardTitle>
                  <CardDescription>
                    Preview how guests see their photo galleries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="preview-guest-id">
                        Guest ID for Preview
                      </Label>
                      <Input
                        id="preview-guest-id"
                        placeholder="Enter guest ID (e.g., GUEST123)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement
                            if (target.value.trim()) {
                              onGuestPreview(target.value.trim())
                            }
                          }
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const input = document.getElementById(
                          'preview-guest-id'
                        ) as HTMLInputElement
                        if (input?.value.trim()) {
                          onGuestPreview(input.value.trim())
                        }
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Gallery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Заказы</CardTitle>
                <CardDescription>
                  Управление заказами ваших клиентов
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Пока нет заказов</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: Order) => (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">Заказ #{order.id}</p>
                            <p className="text-sm text-gray-600">
                              Гость: {order.guestId}
                            </p>
                          </div>
                          <Badge variant="outline">{order.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Сумма: {order.totalAmount}₽ • {order.items.length}{' '}
                          товаров
                        </p>
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
                <CardTitle>
                  <Palette className="w-5 h-5 inline mr-2" />
                  Настройки брендинга
                </CardTitle>
                <CardDescription>
                  Настройте внешний вид галерей для ваших гостей
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSettingsUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandColor">Основной цвет</Label>
                    <div className="flex gap-2">
                      <Input
                        id="brandColor"
                        type="color"
                        value={settingsForm.brandColor}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            brandColor: e.target.value,
                          }))
                        }
                        className="w-20"
                      />
                      <Input
                        value={settingsForm.brandColor}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            brandColor: e.target.value,
                          }))
                        }
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL логотипа</Label>
                    <Input
                      id="logoUrl"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={settingsForm.logoUrl}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          logoUrl: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">
                      Приветственное сообщение
                    </Label>
                    <Input
                      id="welcomeMessage"
                      placeholder="Добро пожаловать в нашу студию!"
                      value={settingsForm.welcomeMessage}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          welcomeMessage: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Сохранение...' : 'Сохранить настройки'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Предварительный просмотр */}
            <Card>
              <CardHeader>
                <CardTitle>Предварительный просмотр</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="p-6 rounded-lg border-2 border-dashed"
                  style={{ borderColor: settingsForm.brandColor }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {settingsForm.logoUrl && (
                      <ImageWithFallback
                        src={settingsForm.logoUrl}
                        alt="Logo"
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3
                        className="font-semibold"
                        style={{ color: settingsForm.brandColor }}
                      >
                        {profile?.studioName}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {settingsForm.welcomeMessage}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="aspect-square bg-gray-200 rounded flex items-center justify-center"
                      >
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    ))}
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
