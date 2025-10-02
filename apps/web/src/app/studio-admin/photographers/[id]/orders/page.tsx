'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { EmptyState } from '@repo/ui/empty-state'
import { Input } from '@repo/ui/input'
import { PageLayout } from '@repo/ui/page-layout'
import { Spinner } from '@repo/ui/spinner'
import {
  ArrowLeft,
  Calendar,
  Download,
  Search,
  ShoppingBag,
  User,
} from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Order {
  id: string
  orderNumber: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  totalAmount: number
  currency: string
  createdAt: string
  updatedAt: string
  guestName: string
  guestEmail: string
  itemCount: number
  items: Array<{
    id: string
    photoId: string
    photoFilename: string
    photoThumbnailUrl: string
    quantity: number
    price: number
    size: string
  }>
}

interface PhotographerDetails {
  id: string
  name: string
  email: string
}

export default function PhotographerOrdersPage() {
  const { _ } = useLingui()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [photographer, setPhotographer] = useState<PhotographerDetails | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const params = useParams()
  const photographerId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch photographer details
        const photographerResponse = await fetch(
          `/api/studio-admin/photographers/${photographerId}`
        )
        const photographerData = await photographerResponse.json()

        if (photographerResponse.ok) {
          setPhotographer(photographerData.photographer)
        } else {
          console.error(
            'Failed to fetch photographer details:',
            photographerData.error
          )
          toast.error(_(msg`Error loading photographer data`))
          router.push('/studio-admin/photographers')
          return
        }

        // Fetch orders
        const ordersResponse = await fetch(
          `/api/studio-admin/photographers/${photographerId}/orders`
        )
        const ordersData = await ordersResponse.json()

        if (ordersResponse.ok) {
          setOrders(ordersData.orders || [])
          setFilteredOrders(ordersData.orders || [])
        } else {
          console.error('Failed to fetch orders:', ordersData.error)
          toast.error(_(msg`Error loading orders`))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error(_(msg`Error loading data`))
      } finally {
        setLoading(false)
      }
    }

    if (photographerId) {
      fetchData()
    }
  }, [photographerId, router, _])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOrders(orders)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredOrders(
        orders.filter(
          (order) =>
            order.orderNumber.toLowerCase().includes(query) ||
            order.guestName.toLowerCase().includes(query) ||
            order.guestEmail.toLowerCase().includes(query) ||
            order.status.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, orders])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'outline'
      case 'paid':
        return 'default'
      case 'shipped':
        return 'secondary'
      case 'delivered':
        return 'default'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return _(msg`Pending Payment`)
      case 'paid':
        return _(msg`Paid`)
      case 'shipped':
        return _(msg`Shipped`)
      case 'delivered':
        return _(msg`Delivered`)
      case 'cancelled':
        return _(msg`Cancelled`)
      default:
        return status
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency || 'RUB',
    }).format(amount)
  }

  if (loading) {
    return (
      <PageLayout
        title={_(msg`Photographer Orders`)}
        description={_(msg`View photographer orders`)}
      >
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  if (!photographer) {
    return (
      <PageLayout
        title={_(msg`Photographer Not Found`)}
        description={_(msg`The requested photographer does not exist`)}
      >
        <div className="text-center py-16">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            <Trans>Photographer Not Found</Trans>
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            <Trans>
              The photographer may have been deleted or you may have entered an
              incorrect ID
            </Trans>
          </p>
          <Button onClick={() => router.push('/studio-admin/photographers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            <Trans>Back to list</Trans>
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={_(msg`Photographer Orders: ${photographer.name}`)}
      description={_(msg`View and manage photographer orders`)}
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={_(msg`Search by order number, guest, or status...`)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/studio-admin/photographers/${photographerId}`)
            }
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <Trans>Back to details</Trans>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    <Trans>Total Orders</Trans>
                  </p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    <Trans>Paid</Trans>
                  </p>
                  <p className="text-2xl font-bold">
                    {
                      orders.filter(
                        (o) =>
                          o.status === 'paid' ||
                          o.status === 'shipped' ||
                          o.status === 'delivered'
                      ).length
                    }
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    <Trans>Pending Payment</Trans>
                  </p>
                  <p className="text-2xl font-bold">
                    {orders.filter((o) => o.status === 'pending').length}
                  </p>
                </div>
                <User className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    <Trans>Total Amount</Trans>
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      orders.reduce((sum, order) => sum + order.totalAmount, 0),
                      orders[0]?.currency || 'RUB'
                    )}
                  </p>
                </div>
                <Download className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="w-12 h-12" />}
            title={searchQuery ? _(msg`No Orders Found`) : _(msg`No Orders`)}
            description={
              searchQuery
                ? _(msg`No orders found matching your search`)
                : _(msg`This photographer has no orders yet`)
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">
                          #{order.orderNumber}
                        </CardTitle>
                        <Badge variant={getStatusVariant(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{order.guestName}</span>
                          <span className="text-slate-400">
                            ({order.guestEmail})
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" />
                            <span>
                              {order.itemCount} <Trans>items</Trans>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatDate(order.updatedAt)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">
                      <Trans>Order items:</Trans>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                        >
                          <Image
                            src={item.photoThumbnailUrl}
                            alt={item.photoFilename}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.photoFilename}
                            </p>
                            <p className="text-xs text-slate-600">
                              {item.size} × {item.quantity}
                            </p>
                          </div>
                          <div className="text-sm font-medium">
                            {formatCurrency(
                              item.price * item.quantity,
                              order.currency
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
