'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { PageLayout } from '@repo/ui/page-layout'
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  Edit,
  FileImage,
  Mail,
  Package,
  Phone,
  User,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  photo: {
    id: string
    fileName: string
    filePath: string
  }
  price: number
}

interface Order {
  id: string
  guestEmail: string
  guestName: string | null
  guestPhone: string | null
  status: string
  paymentMethod: string
  paymentStatus: string
  totalAmount: number
  discount: number
  finalAmount: number
  notes?: string
  processedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  session: {
    id: string
    name: string
    scheduledAt?: string
  }
  photographer: {
    id: string
    name: string | null
    email: string
  }
  studio: {
    id: string
    name: string
  }
  items: OrderItem[]
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { _ } = useLingui()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      const { id } = await params
      const response = await fetch(`/api/orders/${id}`)
      const data = await response.json()

      if (response.ok) {
        setOrder(data.order)
      } else {
        toast.error(data.error || _(msg`Failed to load order`))
        router.push('/admin/orders')
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
      toast.error(_(msg`Failed to load order`))
      router.push('/admin/orders')
    } finally {
      setLoading(false)
    }
  }, [_, router, params])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(_(msg`Order status updated successfully`))
        fetchOrder()
      } else {
        const data = await response.json()
        toast.error(data.error || _(msg`Failed to update order status`))
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error(_(msg`Failed to update order status`))
    } finally {
      setIsUpdating(false)
    }
  }

  const exportOrder = async () => {
    if (!order) return

    try {
      const response = await fetch(`/api/orders/${order.id}/export`)
      const data = await response.json()

      if (response.ok) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `order-${order.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success(_(msg`Order exported successfully`))
      } else {
        toast.error(data.error || _(msg`Failed to export order`))
      }
    } catch (error) {
      console.error('Failed to export order:', error)
      toast.error(_(msg`Failed to export order`))
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <PageLayout title={_(msg`Order Details`)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">
              <Trans>Loading order details...</Trans>
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (!order) {
    return (
      <PageLayout title={_(msg`Order Details`)}>
        <div className="text-center py-12">
          <p className="text-gray-500">
            <Trans>Order not found</Trans>
          </p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={_(msg`Order Details`)}
      action={{
        label: _(msg`Export Order`),
        onClick: exportOrder,
        icon: <Download className="w-4 h-4" />,
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <Trans>Back to Orders</Trans>
        </Button>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {order.session.name}
            </h1>
            <p className="text-gray-600">
              <Trans>Order ID:</Trans> {order.id.slice(0, 8)}...
            </p>
            <p className="text-sm text-gray-500">
              <Trans>Created:</Trans>{' '}
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Badge className={`${getStatusBadge(order.status)} text-sm`}>
              {order.status.toUpperCase()}
            </Badge>
            <Badge
              className={`${getPaymentBadge(order.paymentStatus)} text-sm`}
            >
              {order.paymentStatus.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <Trans>Guest Information</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600 block">
                    <Trans>Name</Trans>
                  </span>
                  <p className="text-gray-900">
                    {order.guestName || _(msg`Not provided`)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 block">
                    <Trans>Email</Trans>
                  </span>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {order.guestEmail}
                  </p>
                </div>
                {order.guestPhone && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 block">
                      <Trans>Phone</Trans>
                    </span>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {order.guestPhone}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                <Trans>Order Items ({order.items.length})</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileImage className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.photo.fileName}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {item.photo.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900">
                      ¥{Number(item.price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    <Trans>Subtotal:</Trans>
                  </span>
                  <span>¥{Number(order.totalAmount).toFixed(2)}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      <Trans>Discount:</Trans>
                    </span>
                    <span>-¥{Number(order.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>
                    <Trans>Total:</Trans>
                  </span>
                  <span>¥{Number(order.finalAmount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session & Photographer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <Trans>Session Details</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600 block">
                    <Trans>Session</Trans>
                  </span>
                  <p className="text-gray-900">{order.session.name}</p>
                  {order.session.scheduledAt && (
                    <p className="text-sm text-gray-500">
                      {new Date(order.session.scheduledAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 block">
                    <Trans>Photographer</Trans>
                  </span>
                  <p className="text-gray-900">
                    {order.photographer.name || order.photographer.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.photographer.email}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 block">
                    <Trans>Studio</Trans>
                  </span>
                  <p className="text-gray-900">{order.studio.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 block">
                    <Trans>Payment Method</Trans>
                  </span>
                  <p className="text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {order.paymentMethod.toUpperCase()}
                  </p>
                </div>
              </div>

              {order.notes && (
                <div>
                  <span className="text-sm font-medium text-gray-600 block">
                    <Trans>Notes</Trans>
                  </span>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {order.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                <Trans>Order Status</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.status === 'pending' && (
                <Button
                  onClick={() => updateOrderStatus('processing')}
                  disabled={isUpdating}
                  className="w-full"
                >
                  <Trans>Start Processing</Trans>
                </Button>
              )}
              {order.status === 'processing' && (
                <Button
                  onClick={() => updateOrderStatus('completed')}
                  disabled={isUpdating}
                  className="w-full"
                >
                  <Trans>Mark as Completed</Trans>
                </Button>
              )}
              {(order.status === 'pending' ||
                order.status === 'processing') && (
                <Button
                  onClick={() => updateOrderStatus('cancelled')}
                  disabled={isUpdating}
                  variant="outline"
                  className="w-full text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Trans>Cancel Order</Trans>
                </Button>
              )}

              {/* Status Timeline */}
              <div className="pt-4 border-t space-y-2">
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">
                      <Trans>Created:</Trans>
                    </span>
                  </div>
                  <p className="text-gray-500 ml-5">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                {order.processedAt && (
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium">
                        <Trans>Processed:</Trans>
                      </span>
                    </div>
                    <p className="text-gray-500 ml-5">
                      {new Date(order.processedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {order.completedAt && (
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">
                        <Trans>Completed:</Trans>
                      </span>
                    </div>
                    <p className="text-gray-500 ml-5">
                      {new Date(order.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>Quick Actions</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={exportOrder}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                <Trans>Export Order</Trans>
              </Button>
              <Button
                onClick={() =>
                  router.push(`/admin/photographers/${order.photographer.id}`)
                }
                variant="outline"
                className="w-full"
              >
                <User className="w-4 h-4 mr-2" />
                <Trans>View Photographer</Trans>
              </Button>
              <Button
                onClick={() =>
                  router.push(`/photographer/sessions/${order.session.id}`)
                }
                variant="outline"
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                <Trans>View Session</Trans>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
