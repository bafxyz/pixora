'use client'

import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
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
  LogOut,
  Settings,
  ShoppingCart,
  Upload,
} from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { env } from '@/shared/config/env'
import { logAuthError } from '@/shared/lib/auth/logging'
import { createClient } from '@/shared/lib/supabase/client'
import { useAuthStore } from '@/shared/stores/auth.store'

const supabase = createClient()

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
  const { _ } = useLingui()
  const signOut = useAuthStore((state) => state.signOut)
  const [activeTab, setActiveTab] = useState('upload')
  const [profile, setProfile] = useState<PhotographerProfile | null>(null)

  const [orders, setOrders] = useState<Order[]>([])

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      logAuthError('Dashboard: Error getting session:', {
        error: error.message,
        code: error.code,
        status: error.status,
        timestamp: new Date().toISOString(),
        details: {
          method: 'getSession',
          component: 'PhotographerDashboard',
        },
      })
      return null
    }

    return session?.access_token
  }, [])

  // Profile loading
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
        }
      } catch (error) {
        console.error('Profile loading error:', error)
      }
    }

    loadProfile()
  }, [user.id])

  // Orders loading
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

  // Brand settings update

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Camera className="w-8 h-8" style={{ color: '#3B82F6' }} />
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
              <Trans>Sign Out</Trans>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 gap-4 h-14 p-4 bg-white/80 backdrop-blur-md border border-white/30 shadow-lg mb-6 rounded-lg">
            <TabsTrigger
              value="upload"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-indigo-600 data-[state=active]:text-white hover:bg-primary/10 transition-all duration-200"
            >
              <Upload className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                <Trans>Upload</Trans>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-pink-600 data-[state=active]:text-white hover:bg-secondary/10 transition-all duration-200"
            >
              <ShoppingCart className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                <Trans>Orders</Trans>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-amber-600 data-[state=active]:text-white hover:bg-accent/10 transition-all duration-200"
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                <Trans>Settings</Trans>
              </span>
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
                      toast.success(
                        _(
                          'Successfully uploaded and saved {count} photos for guest {guestId}!',
                          { count: result.count, guestId }
                        )
                      )
                    } else {
                      const error = await response.json()
                      throw new Error(error.error || 'Failed to save photos')
                    }
                  } catch (error) {
                    console.error('Save photos error:', error)
                    toast.error(
                      `Upload successful but failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`
                    )
                  }
                }}
                onUploadError={(error) => {
                  toast.error(`Upload failed: ${error}`)
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
                <CardTitle>
                  <Trans>Orders</Trans>
                </CardTitle>
                <CardDescription>
                  <Trans>Manage your customer orders</Trans>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      <Trans>No orders yet</Trans>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: Order) => (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">
                              <Trans>Order</Trans> #{order.id}
                            </p>
                            <p className="text-sm text-gray-600">
                              <Trans>Guest</Trans>: {order.guestId}
                            </p>
                          </div>
                          <Badge variant="outline">{order.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          <Trans>Total</Trans>: {order.totalAmount}₽ •{' '}
                          {order.items.length} <Trans>items</Trans>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
