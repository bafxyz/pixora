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
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { BarChart3, Building, Eye, Plus, Settings, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { LanguageSwitcher } from '@/shared/components/language-switcher'

interface Client {
  id: string
  name: string
  email: string
  created_at: string
  guestsCount: number
  photosCount: number
  ordersCount: number
}

interface GlobalStats {
  totalClients: number
  totalGuests: number
  totalPhotos: number
  totalOrders: number
  totalRevenue: number
}

export default function SuperAdminPage() {
  const { _ } = useLingui()
  const [clients, setClients] = useState<Client[]>([])
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalClients: 0,
    totalGuests: 0,
    totalPhotos: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Загружаем клиентов
      const clientsResponse = await fetch('/api/super-admin/clients')
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        setClients(clientsData.clients || [])
      } else {
        console.error('Failed to load clients:', clientsResponse.status)
        setClients([])
      }

      // Загружаем глобальную статистику
      const statsResponse = await fetch('/api/super-admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setGlobalStats(
          statsData.stats || {
            totalClients: 0,
            totalGuests: 0,
            totalPhotos: 0,
            totalOrders: 0,
            totalRevenue: 0,
          }
        )
      } else {
        console.error('Failed to load stats:', statsResponse.status)
        setGlobalStats({
          totalClients: 0,
          totalGuests: 0,
          totalPhotos: 0,
          totalOrders: 0,
          totalRevenue: 0,
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
      // Set default values on error
      setClients([])
      setGlobalStats({
        totalClients: 0,
        totalGuests: 0,
        totalPhotos: 0,
        totalOrders: 0,
        totalRevenue: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateClient = async () => {
    if (!newClientName.trim() || !newClientEmail.trim()) {
      alert(_('Fill in all fields'))
      return
    }

    try {
      const response = await fetch('/api/super-admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newClientName.trim(),
          email: newClientEmail.trim(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setClients((prev) => [...prev, result.client])
        setNewClientName('')
        setNewClientEmail('')
        setShowCreateForm(false)
        alert(_('Client created successfully!'))
      } else {
        alert(_('Error creating client'))
      }
    } catch (error) {
      console.error('Error creating client:', error)
      alert(_('Error creating client'))
    }
  }

  const handleViewClient = (clientId: string) => {
    // В будущем можно добавить страницу просмотра клиента
    console.log('View client:', clientId)
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <Trans>Super Administrator</Trans>
          </h1>
          <p className="text-gray-600">
            <Trans>Manage all platform clients</Trans>
          </p>
        </div>

        {/* Глобальная статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    <Trans>Clients</Trans>
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {globalStats.totalClients}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    <Trans>Guests</Trans>
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {globalStats.totalGuests}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    <Trans>Photos</Trans>
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {globalStats.totalPhotos}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    <Trans>Orders</Trans>
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {globalStats.totalOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    <Trans>Revenue</Trans>
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${globalStats.totalRevenue}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Управление клиентами */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              <Trans>Clients</Trans> ({clients.length})
            </h2>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="w-4 h-4 mr-2" />
              {showCreateForm ? (
                <Trans>Cancel</Trans>
              ) : (
                <Trans>Add Client</Trans>
              )}
            </Button>
          </div>
        </div>

        {/* Форма создания клиента */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                <Trans>Create New Client</Trans>
              </CardTitle>
              <CardDescription>
                <Trans>Add a new photo studio to the system</Trans>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">
                    <Trans>Studio Name</Trans>
                  </Label>
                  <Input
                    id="clientName"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder={_('My Photo Studio')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="clientEmail">
                    <Trans>Administrator Email</Trans>
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="admin@studio.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  <Trans>Cancel</Trans>
                </Button>
                <Button onClick={handleCreateClient}>
                  <Trans>Create Client</Trans>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Список клиентов */}
        <div className="grid gap-4">
          {clients.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  <Trans>No clients</Trans>
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  <Trans>Create the first client to get started</Trans>
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  <Trans>Add Client</Trans>
                </Button>
              </CardContent>
            </Card>
          ) : (
            clients.map((client) => (
              <Card key={client.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {client.name}
                      </h3>
                      <p className="text-sm text-gray-600">{client.email}</p>
                      <p className="text-xs text-gray-500">
                        <Trans>Created</Trans>:{' '}
                        {client.created_at
                          ? new Date(client.created_at).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="text-center">
                      <p className="font-medium">{client.guestsCount}</p>
                      <p>
                        <Trans>Guests</Trans>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{client.photosCount}</p>
                      <p>
                        <Trans>Photos</Trans>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{client.ordersCount}</p>
                      <p>
                        <Trans>Orders</Trans>
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleViewClient(client.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    <Trans>View</Trans>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
