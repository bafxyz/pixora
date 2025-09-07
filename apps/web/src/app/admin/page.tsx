'use client'

import { Trans } from '@lingui/react/macro'
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
  BarChart3,
  Download,
  Eye,
  Plus,
  QrCode,
  Send,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { DeliveryNotification } from '@/features/admin/components/delivery-notification'
import { QRGenerator } from '@/features/qr/components/qr-generator'

interface Guest {
  id: string
  name: string
  email?: string
  created_at: string
  photosCount: number
}

interface Stats {
  totalGuests: number
  totalPhotos: number
  totalOrders: number
  revenue: number
}

interface Order {
  id: string
  guest_id: string
  photographer_id: string
  photo_ids: string[]
  total_amount: number
  status: string
  created_at: string
  updated_at: string
  guests: {
    id: string
    name: string
    email: string
  }
  photographers: {
    id: string
    name: string
  }
}

export default function AdminPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] =
    useState<Order | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalGuests: 0,
    totalPhotos: 0,
    totalOrders: 0,
    revenue: 0,
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Загружаем гостей
      const guestsResponse = await fetch('/api/admin/guests')
      if (guestsResponse.ok) {
        const guestsData = await guestsResponse.json()
        setGuests(guestsData.guests || [])
      }

      // Загружаем статистику
      const statsResponse = await fetch('/api/admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats || stats)
      }

      // Загружаем заказы
      const ordersResponse = await fetch('/api/admin/orders')
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData.orders || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [stats])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleViewGallery = (guestId: string) => {
    window.open(`/gallery/${guestId}`, '_blank')
  }

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
            <Trans>Dashboard</Trans>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            <Trans>Manage guests and track statistics</Trans>
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 lg:space-y-6"
        >
          {/* Mobile-friendly tabs */}
          <div className="overflow-x-auto">
            <TabsList className="grid w-max min-w-full grid-cols-5 lg:w-full h-10 sm:h-11 lg:h-12 p-1 bg-white/80 backdrop-blur-md border border-white/30 shadow-lg">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-1 text-xs px-1 sm:px-2 lg:px-4 font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
              >
                <BarChart3 className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate">
                  <Trans>Overview</Trans>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="guests"
                className="flex items-center gap-1 text-xs px-1 sm:px-2 lg:px-4 font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
              >
                <Users className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate">
                  <Trans>Guests</Trans>
                </span>
                <span className="text-xs">({guests.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="flex items-center gap-1 text-xs px-1 sm:px-2 lg:px-4 font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
              >
                <ShoppingCart className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                <span className="hidden xs:inline truncate">
                  <Trans>Orders</Trans>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="qr"
                className="flex items-center gap-1 text-xs px-1 sm:px-2 lg:px-4 font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
              >
                <QrCode className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">
                  <Trans>QR Codes</Trans>
                </span>
                <span className="sm:hidden">QR</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-1 text-xs px-1 sm:px-2 lg:px-4 font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
              >
                <Settings className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">
                  <Trans>Settings</Trans>
                </span>
                <span className="sm:hidden">⚙️</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center">
                    <Users className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0" />
                    <div className="ml-3 lg:ml-4">
                      <p className="text-xs lg:text-sm font-medium text-gray-600">
                        <Trans>Total Guests</Trans>
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {stats.totalGuests}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center">
                    <QrCode className="w-6 h-6 lg:w-8 lg:h-8 text-green-600 flex-shrink-0" />
                    <div className="ml-3 lg:ml-4">
                      <p className="text-xs lg:text-sm font-medium text-gray-600">
                        <Trans>Photos</Trans>
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {stats.totalPhotos}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center">
                    <BarChart3 className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600 flex-shrink-0" />
                    <div className="ml-3 lg:ml-4">
                      <p className="text-xs lg:text-sm font-medium text-gray-600">
                        <Trans>Orders</Trans>
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {stats.totalOrders}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center">
                    <Download className="w-6 h-6 lg:w-8 lg:h-8 text-orange-600 flex-shrink-0" />
                    <div className="ml-3 lg:ml-4">
                      <p className="text-xs lg:text-sm font-medium text-gray-600">
                        <Trans>Revenue</Trans>
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        ${stats.revenue}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="guests" className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg lg:text-xl font-semibold">
                <Trans>Guest Management</Trans>
              </h2>
              <Button
                onClick={() => setActiveTab('qr')}
                size="sm"
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                <Trans>Create Guest</Trans>
              </Button>
            </div>

            <div className="grid gap-3 lg:gap-4">
              {guests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 lg:py-12">
                    <Users className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mb-4" />
                    <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">
                      <Trans>No guests yet</Trans>
                    </h3>
                    <p className="text-gray-600 text-center mb-4 text-sm lg:text-base">
                      <Trans>Create your first guest using a QR code</Trans>
                    </p>
                    <Button onClick={() => setActiveTab('qr')} size="sm">
                      <Trans>Create QR Code</Trans>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                guests.map((guest) => (
                  <Card key={guest.id}>
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3 lg:space-x-4">
                          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 text-sm lg:text-base truncate">
                              {guest.name}
                            </h3>
                            <p className="text-xs lg:text-sm text-gray-600 truncate">
                              {guest.email || (
                                <Trans>Email not specified</Trans>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              <Trans>Created</Trans>:{' '}
                              {guest.created_at
                                ? new Date(
                                    guest.created_at
                                  ).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                          <Button
                            onClick={() => handleViewGallery(guest.id)}
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto text-xs lg:text-sm"
                          >
                            <Eye className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                            <Trans>Gallery</Trans>
                          </Button>
                          <Button
                            onClick={() =>
                              window.open(`/gallery/${guest.id}`, '_blank')
                            }
                            size="sm"
                            className="w-full sm:w-auto text-xs lg:text-sm"
                          >
                            <QrCode className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                            <Trans>QR Code</Trans>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                <Trans>Order Management</Trans>
              </h2>
            </div>

            <div className="grid gap-4">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      <Trans>No orders</Trans>
                    </h3>
                    <p className="text-gray-600 text-center">
                      <Trans>
                        Orders will appear here after guests place them
                      </Trans>
                    </p>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            <Trans>Order</Trans> #{order.id.slice(-8)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            <Trans>Guest</Trans>:{' '}
                            {order.guests?.name || <Trans>Unknown</Trans>}
                          </p>
                          <p className="text-sm text-gray-600">
                            <Trans>Photographer</Trans>:{' '}
                            {order.photographers?.name || (
                              <Trans>Unknown</Trans>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ${order.total_amount}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            <Trans>Status</Trans>:
                          </span>
                          <select
                            value={order.status}
                            onChange={async (e) => {
                              const response = await fetch(
                                '/api/admin/orders',
                                {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    orderId: order.id,
                                    status: e.target.value,
                                  }),
                                }
                              )
                              if (response.ok) {
                                // Reload orders
                                const ordersResponse =
                                  await fetch('/api/admin/orders')
                                if (ordersResponse.ok) {
                                  const ordersData = await ordersResponse.json()
                                  setOrders(ordersData.orders || [])
                                }
                              }
                            }}
                            className={`px-2 py-1 text-xs rounded-full border ${
                              order.status === 'new'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : order.status === 'ready'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : order.status === 'completed'
                                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                                    : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}
                          >
                            <option value="new">
                              <Trans>New</Trans>
                            </option>
                            <option value="ready">
                              <Trans>Ready</Trans>
                            </option>
                            <option value="completed">
                              <Trans>Completed</Trans>
                            </option>
                            <option value="cancelled">
                              <Trans>Cancelled</Trans>
                            </option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            <Trans>Photos</Trans>:{' '}
                            {order.photo_ids?.length || 0}
                          </span>
                          {order.status === 'ready' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedOrderForDelivery(order)}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              <Trans>Notify Guest</Trans>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Delivery Notification Modal */}
          {selectedOrderForDelivery && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border">
                <div className="p-6">
                  <DeliveryNotification
                    order={{
                      id: selectedOrderForDelivery.id,
                      guestId: selectedOrderForDelivery.guest_id,
                      guestName:
                        selectedOrderForDelivery.guests?.name || 'Guest',
                      guestEmail: selectedOrderForDelivery.guests?.email || '',
                      status: selectedOrderForDelivery.status,
                      totalAmount: selectedOrderForDelivery.total_amount,
                      items:
                        selectedOrderForDelivery.photo_ids?.map((id) => ({
                          id,
                          name: `Photo ${id.slice(-8)}`,
                          quantity: 1,
                          price:
                            selectedOrderForDelivery.total_amount /
                            (selectedOrderForDelivery.photo_ids?.length || 1),
                        })) || [],
                    }}
                    photographerName="Photographer" // TODO: Get from photographer data
                    studioName="Photo Studio" // TODO: Get from studio data
                    onNotificationSent={() => {
                      setSelectedOrderForDelivery(null)
                      // Optionally reload orders to update status
                    }}
                  />
                  <div className="mt-6 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedOrderForDelivery(null)}
                    >
                      <Trans>Close</Trans>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <TabsContent value="qr" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <QRGenerator
                onGenerate={(qrData) => {
                  console.log('Generated QR:', qrData)
                  // Можно добавить логику сохранения QR
                }}
              />

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>QR Code Management</Trans>
                  </CardTitle>
                  <CardDescription>
                    <Trans>Create QR codes for new guests</Trans>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">
                      <Trans>How to use QR codes</Trans>:
                    </h4>
                    <ol className="text-sm text-gray-600 space-y-1">
                      <li>
                        1. <Trans>Create QR code for guest</Trans>
                      </li>
                      <li>
                        2. <Trans>Print or send it to the guest</Trans>
                      </li>
                      <li>
                        3. <Trans>Photographer scans QR at event</Trans>
                      </li>
                      <li>
                        4.{' '}
                        <Trans>Photos automatically go to guest gallery</Trans>
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">
                      <Trans>Benefits</Trans>:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        • <Trans>Fast guest identification</Trans>
                      </li>
                      <li>
                        • <Trans>Automatic gallery creation</Trans>
                      </li>
                      <li>
                        • <Trans>Convenient photo access</Trans>
                      </li>
                      <li>
                        • <Trans>Order tracking</Trans>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Studio Settings</Trans>
                </CardTitle>
                <CardDescription>
                  <Trans>Configure your photo studio settings</Trans>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="studioName">
                      <Trans>Studio Name</Trans>
                    </Label>
                    <Input
                      id="studioName"
                      placeholder="My Photo Studio"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">
                      <Trans>Contact Email</Trans>
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="info@studio.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">
                      <Trans>Phone</Trans>
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">
                      <Trans>Website</Trans>
                    </Label>
                    <Input
                      id="website"
                      placeholder="https://studio.com"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Trans>Save Settings</Trans>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
