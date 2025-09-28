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
import { toast } from 'sonner'

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
      const clientsResponse = await fetch('/api/admin/clients')
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        setClients(clientsData.clients || [])
      } else {
        console.error('Failed to load clients:', clientsResponse.status)
        setClients([])
      }

      // Загружаем глобальную статистику
      const statsResponse = await fetch('/api/admin/stats')
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
      toast.error(_('Fill in all fields'))
      return
    }

    try {
      const response = await fetch('/api/admin/clients', {
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
        toast.success(_('Client created successfully!'))
      } else {
        toast.error(_('Error creating client'))
      }
    } catch (error) {
      console.error('Error creating client:', error)
      toast.error(_('Error creating client'))
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            <Trans>System Overview</Trans>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            <Trans>Manage all platform clients</Trans>
          </p>
        </div>

        {/* Глобальная статистика */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-slate-600 truncate">
                    <Trans>Clients</Trans>
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-800">
                    {globalStats.totalClients}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-secondary to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-slate-600 truncate">
                    <Trans>Guests</Trans>
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-800">
                    {globalStats.totalGuests}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-slate-600 truncate">
                    <Trans>Photos</Trans>
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-800">
                    {globalStats.totalPhotos}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-accent to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-slate-600 truncate">
                    <Trans>Orders</Trans>
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-800">
                    {globalStats.totalOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 col-span-2 lg:col-span-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-slate-600 truncate">
                    <Trans>Revenue</Trans>
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-800">
                    ${globalStats.totalRevenue}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Управление клиентами */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200">
                <Trans>Clients</Trans>{' '}
                <span className="text-primary">({clients.length})</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <Trans>Manage photo studio accounts</Trans>
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
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
          <Card className="mb-6 bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">
                <Trans>Create New Client</Trans>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
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

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="order-2 sm:order-1 bg-white/70 border-white/30 hover:bg-white/90"
                >
                  <Trans>Cancel</Trans>
                </Button>
                <Button
                  onClick={handleCreateClient}
                  className="order-1 sm:order-2 bg-gradient-to-r from-secondary to-pink-600 hover:from-secondary/90 hover:to-pink-600/90 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
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
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <Trans>Add Client</Trans>
                </Button>
              </CardContent>
            </Card>
          ) : (
            clients.map((client) => (
              <Card
                key={client.id}
                className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Left side - Main info */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {client.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {client.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          <Trans>Created</Trans>:{' '}
                          {client.created_at
                            ? new Date(client.created_at).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Stats - Mobile: horizontal, Desktop: vertical */}
                    <div className="flex justify-between sm:justify-center sm:space-x-6 text-xs sm:text-sm text-gray-600">
                      <div className="text-center">
                        <p className="font-bold text-base sm:text-lg text-primary">
                          {client.guestsCount}
                        </p>
                        <p className="text-xs">
                          <Trans>Guests</Trans>
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-base sm:text-lg text-secondary">
                          {client.photosCount}
                        </p>
                        <p className="text-xs">
                          <Trans>Photos</Trans>
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-base sm:text-lg text-accent">
                          {client.ordersCount}
                        </p>
                        <p className="text-xs">
                          <Trans>Orders</Trans>
                        </p>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="flex justify-end sm:justify-start">
                      <Button
                        onClick={() => handleViewClient(client.id)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        <Trans>View</Trans>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
