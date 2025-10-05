'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { PageLayout } from '@repo/ui/page-layout'
import { ArrowLeft } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  photo: {
    id: string
    fileName: string
    filePath: string
  } | null
  price: number
  productType: string
  quantity: number
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
  createdAt: string
  session: {
    id: string
    name: string
    scheduledAt: string | null
  }
  photographer: {
    id: string
    name: string
    email: string
  }
  studio: {
    id: string
    name: string
  }
  items: OrderItem[]
}

export default function OrderDetailPage() {
  const { _ } = useLingui()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()

      if (response.ok) {
        setOrder(data.order)
      } else {
        toast.error(data.error || _(msg`Failed to fetch order`))
        router.push('/studio-admin/orders')
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
      toast.error(_(msg`Failed to fetch order`))
      router.push('/studio-admin/orders')
    } finally {
      setLoading(false)
    }
  }, [orderId, _, router])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const updateOrderStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
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
    }
  }

  const updatePaymentStatus = async (newPaymentStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/payment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      })

      if (response.ok) {
        toast.success(_(msg`Payment status updated successfully`))
        fetchOrder()
      } else {
        const data = await response.json()
        toast.error(data.error || _(msg`Failed to update payment status`))
      }
    } catch (error) {
      console.error('Failed to update payment status:', error)
      toast.error(_(msg`Failed to update payment status`))
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
          <div className="text-gray-500">
            <Trans>Loading order...</Trans>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (!order) {
    return null
  }

  return (
    <PageLayout title={_(msg`Order Details`)}>
      <button
        type="button"
        onClick={() => router.push('/studio-admin/orders')}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <Trans>Back to Orders</Trans>
      </button>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{order.session.name}</h2>
            <p className="text-sm text-gray-600">
              <Trans>Order ID:</Trans> {order.id}
            </p>
            <p className="text-sm text-gray-600">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                <Trans>Status:</Trans>
              </span>
              <div
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}
              >
                {order.status.toUpperCase()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                <Trans>Payment:</Trans>
              </span>
              <div
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadge(order.paymentStatus)}`}
              >
                {order.paymentStatus.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold mb-3">
              <Trans>Guest Information</Trans>
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">
                  <Trans>Name</Trans>
                </p>
                <p className="font-medium">{order.guestName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <Trans>Email</Trans>
                </p>
                <p className="font-medium">{order.guestEmail}</p>
              </div>
              {order.guestPhone && (
                <div>
                  <p className="text-sm text-gray-600">
                    <Trans>Phone</Trans>
                  </p>
                  <p className="font-medium">{order.guestPhone}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">
              <Trans>Order Information</Trans>
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">
                  <Trans>Studio</Trans>
                </p>
                <p className="font-medium">{order.studio.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <Trans>Photographer</Trans>
                </p>
                <p className="font-medium">{order.photographer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <Trans>Payment Method</Trans>
                </p>
                <p className="font-medium">
                  {order.paymentMethod.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">
            <Trans>Order Items</Trans>
          </h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {item.photo?.fileName || item.productType}
                  </p>
                  <p className="text-sm text-gray-600">
                    <Trans>Type:</Trans> {item.productType} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold">
                  ${Number(item.price).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-6 mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>
              <Trans>Subtotal:</Trans>
            </span>
            <span>${Number(order.totalAmount).toFixed(2)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-sm text-green-600 mb-2">
              <span>
                <Trans>Discount:</Trans>
              </span>
              <span>-${Number(order.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg mt-4">
            <span>
              <Trans>Total:</Trans>
            </span>
            <span>${Number(order.finalAmount).toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {/* Order Status Actions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              <Trans>Order Status</Trans>
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              {order.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => updateOrderStatus('processing')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-1"
                >
                  <Trans>Start Processing</Trans>
                </button>
              )}
              {order.status === 'processing' && (
                <button
                  type="button"
                  onClick={() => updateOrderStatus('completed')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex-1"
                >
                  <Trans>Mark as Completed</Trans>
                </button>
              )}
              {(order.status === 'pending' ||
                order.status === 'processing') && (
                <button
                  type="button"
                  onClick={() => updateOrderStatus('cancelled')}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex-1"
                >
                  <Trans>Cancel Order</Trans>
                </button>
              )}
            </div>
          </div>

          {/* Payment Status Actions - Only for Cash */}
          {order.paymentMethod === 'cash' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                <Trans>Payment Status (Cash)</Trans>
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                {order.paymentStatus === 'pending' && (
                  <button
                    type="button"
                    onClick={() => updatePaymentStatus('paid')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex-1"
                  >
                    <Trans>Mark as Paid</Trans>
                  </button>
                )}
                {order.paymentStatus === 'paid' && (
                  <button
                    type="button"
                    onClick={() => updatePaymentStatus('refunded')}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex-1"
                  >
                    <Trans>Mark as Refunded</Trans>
                  </button>
                )}
                {order.paymentStatus === 'pending' && (
                  <button
                    type="button"
                    onClick={() => updatePaymentStatus('failed')}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex-1"
                  >
                    <Trans>Mark as Failed</Trans>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Info about Tinkoff payments */}
          {order.paymentMethod === 'tinkoff' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <Trans>
                  Payment status for Tinkoff payments is updated automatically
                  via payment gateway callback
                </Trans>
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
