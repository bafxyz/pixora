import { msg, Trans } from '@lingui/macro'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import {
  BarChart3,
  Camera,
  Eye,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react'
import React, { useState } from 'react'
import { useAuth } from '@/shared/providers/auth-provider'

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

interface AdminPanelProps {
  user: User
}

export function AdminPanel(_props: AdminPanelProps) {
  const { _ } = useLingui()
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, _setStats] = useState({
    totalPhotographers: 15,
    totalPhotos: 1250,
    totalOrders: 89,
    revenue: 125000,
  })

  const [recentPhotographers] = useState([
    {
      id: '1',
      name: 'Anna Petrova',
      studioName: 'Petrova Studio',
      email: 'anna@studio.com',
      joinDate: '2024-01-15',
      photosCount: 120,
      ordersCount: 15,
    },
    {
      id: '2',
      name: 'Mikhail Ivanov',
      studioName: 'Photo-Magic',
      email: 'mikhail@photo.com',
      joinDate: '2024-02-20',
      photosCount: 89,
      ordersCount: 8,
    },
    {
      id: '3',
      name: 'Elena Sidorova',
      studioName: 'Moment',
      email: 'elena@moment.ru',
      joinDate: '2024-03-01',
      photosCount: 156,
      ordersCount: 22,
    },
  ])

  const [recentOrders] = useState([
    {
      id: 'ORDER001',
      photographerName: 'Anna Petrova',
      guestId: 'GUEST123',
      amount: 2500,
      status: 'completed',
      date: '2024-03-10',
    },
    {
      id: 'ORDER002',
      photographerName: 'Mikhail Ivanov',
      guestId: 'GUEST456',
      amount: 1800,
      status: 'processing',
      date: '2024-03-09',
    },
    {
      id: 'ORDER003',
      photographerName: 'Elena Sidorova',
      guestId: 'GUEST789',
      amount: 3200,
      status: 'pending',
      date: '2024-03-08',
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return _(msg`Completed`)
      case 'processing':
        return _(msg`Processing`)
      case 'pending':
        return _(msg`Pending`)
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Camera className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Pixora Admin
                </h1>
                <p className="text-gray-600">
                  <Trans>Admin Panel</Trans>
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
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              <Trans>Overview</Trans>
            </TabsTrigger>
            <TabsTrigger value="photographers">
              <Users className="w-4 h-4 mr-2" />
              <Trans>Photographers</Trans>
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingCart className="w-4 h-4 mr-2" />
              <Trans>Orders</Trans>
            </TabsTrigger>
            <TabsTrigger value="system">
              <Settings className="w-4 h-4 mr-2" />
              <Trans>System</Trans>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Trans>Photographers</Trans>
                  </CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalPhotographers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+12%</span>{' '}
                    <Trans>this month</Trans>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Trans>Photos</Trans>
                  </CardTitle>
                  <Camera className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalPhotos.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+234</span>{' '}
                    <Trans>this week</Trans>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Trans>Orders</Trans>
                  </CardTitle>
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+5</span>{' '}
                    <Trans>today</Trans>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Trans>Revenue</Trans>
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.revenue.toLocaleString()}₽
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+18%</span>{' '}
                    <Trans>this month</Trans>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>New Photographers</Trans>
                  </CardTitle>
                  <CardDescription>
                    <Trans>Recent registrations</Trans>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPhotographers.slice(0, 3).map((photographer) => (
                      <div
                        key={photographer.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Camera className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{photographer.name}</p>
                            <p className="text-sm text-gray-600">
                              {photographer.studioName}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {photographer.photosCount} <Trans>photos</Trans>
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>Recent Orders</Trans>
                  </CardTitle>
                  <CardDescription>
                    <Trans>Customer activity</Trans>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.slice(0, 3).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-gray-600">
                              {order.photographerName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{order.amount}₽</p>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="photographers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Manage Photographers</Trans>
                </CardTitle>
                <CardDescription>
                  <Trans>
                    List of all registered photographers in the system
                  </Trans>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPhotographers.map((photographer) => (
                    <div
                      key={photographer.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Camera className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {photographer.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">
                              {photographer.studioName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {photographer.email}
                            </p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-600">
                              <span>📅 {photographer.joinDate}</span>
                              <span>
                                📸 {photographer.photosCount} {_(msg`photos`)}
                              </span>
                              <span>
                                🛒 {photographer.ordersCount} {_(msg`orders`)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            <Trans>View</Trans>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4 mr-1" />
                            <Trans>Settings</Trans>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Manage Orders</Trans>
                </CardTitle>
                <CardDescription>
                  <Trans>All orders in the system with status tracking</Trans>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              <Trans>Order</Trans> #{order.id}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">
                              <Trans>Photographer</Trans>:{' '}
                              {order.photographerName}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <Trans>Guest</Trans>: {order.guestId}
                            </p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-600">
                              <span>📅 {order.date}</span>
                              <span>💰 {order.amount}₽</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              <Trans>Details</Trans>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>System Information</Trans>
                  </CardTitle>
                  <CardDescription>
                    <Trans>Main platform parameters</Trans>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      <Trans>Platform version:</Trans>
                    </span>
                    <span className="text-sm font-medium">1.2.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      <Trans>Uptime:</Trans>
                    </span>
                    <span className="text-sm font-medium">15 days 8 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      <Trans>Storage usage:</Trans>
                    </span>
                    <span className="text-sm font-medium">2.3 GB / 100 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      <Trans>Active users:</Trans>
                    </span>
                    <span className="text-sm font-medium">
                      42 <Trans>today</Trans>
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>Quick Actions</Trans>
                  </CardTitle>
                  <CardDescription>
                    <Trans>System management</Trans>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    <Trans>Platform Settings</Trans>
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    <Trans>User Management</Trans>
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    <Trans>Export Reports</Trans>
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="w-4 h-4 mr-2" />
                    <Trans>Backup</Trans>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>System Logs</Trans>
                </CardTitle>
                <CardDescription>
                  <Trans>Recent system events</Trans>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-sm max-h-64 overflow-y-auto bg-gray-50 p-4 rounded">
                  <div className="text-green-600">
                    [2024-03-10 14:23:45] INFO: New photographer registered:
                    anna@studio.com
                  </div>
                  <div className="text-blue-600">
                    [2024-03-10 14:20:32] INFO: Order ORDER003 created by
                    GUEST789
                  </div>
                  <div className="text-yellow-600">
                    [2024-03-10 14:15:18] WARN: High storage usage detected
                    (85%)
                  </div>
                  <div className="text-green-600">
                    [2024-03-10 14:12:45] INFO: Payment processed for ORDER002
                  </div>
                  <div className="text-blue-600">
                    [2024-03-10 14:08:11] INFO: 15 new photos uploaded by user
                    mikhail@photo.com
                  </div>
                  <div className="text-green-600">
                    [2024-03-10 14:05:33] INFO: System backup completed
                    successfully
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
