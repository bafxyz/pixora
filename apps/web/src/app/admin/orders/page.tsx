'use client'

import { msg } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/macro'
import { PageLayout } from '@repo/ui/page-layout'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  photo: {
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
  createdAt: string
  session: {
    name: string
    scheduledAt: string | null
  }
  items: OrderItem[]
}

export default function OrdersPage() {
  const { _ } = useLingui()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [paymentFilter, setPaymentFilter] = useState<string>('')

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (paymentFilter) params.append('paymentStatus', paymentFilter)

      const response = await fetch(`/api/orders/list?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, paymentFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(_(msg`Order status updated successfully`))
        fetchOrders()
      } else {
        const data = await response.json()
        toast.error(data.error || _(msg`Failed to update order status`))
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error(_(msg`Failed to update order status`))
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
      <PageLayout title={_(msg`Orders Management`)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">
            <Trans>Loading orders...</Trans>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={_(msg`Orders Management`)}>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full sm:w-auto hover:cursor-pointer"
        >
          <option value="">{_(msg`All Statuses`)}</option>
          <option value="pending">{_(msg`Pending`)}</option>
          <option value="processing">{_(msg`Processing`)}</option>
          <option value="completed">{_(msg`Completed`)}</option>
          <option value="cancelled">{_(msg`Cancelled`)}</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full sm:w-auto hover:cursor-pointer"
        >
          <option value="">{_(msg`All Payments`)}</option>
          <option value="pending">{_(msg`Pending`)}</option>
          <option value="paid">{_(msg`Paid`)}</option>
          <option value="failed">{_(msg`Failed`)}</option>
        </select>

        <div className="sm:ml-auto text-sm text-gray-600">
          <Trans>Total: {orders.length} orders</Trans>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trans>No orders found</Trans>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/orders/${order.id}`)}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {order.session.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Order ID: {order.id.slice(0, 8)}...
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${getStatusBadge(order.status)}`}
                  >
                    {order.status.toUpperCase()}
                  </div>
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ml-0 sm:ml-2 ${getPaymentBadge(order.paymentStatus)}`}
                  >
                    {order.paymentStatus.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">
                    <Trans>Guest</Trans>
                  </p>
                  <p className="font-medium">
                    {order.guestName || order.guestEmail}
                  </p>
                  <p className="text-sm text-gray-500">{order.guestEmail}</p>
                  {order.guestPhone && (
                    <p className="text-sm text-gray-500">{order.guestPhone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <Trans>Payment</Trans>
                  </p>
                  <p className="font-medium">
                    {order.paymentMethod.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">
                    <Trans>
                      {order.items.length} photo
                      {order.items.length > 1 ? 's' : ''}
                    </Trans>
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span>
                    <Trans>Subtotal:</Trans>
                  </span>
                  <span>${Number(order.totalAmount).toFixed(2)}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      <Trans>Discount:</Trans>
                    </span>
                    <span>-${Number(order.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>
                    <Trans>Total:</Trans>
                  </span>
                  <span>${Number(order.finalAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {order.status === 'pending' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateOrderStatus(order.id, 'processing')
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:cursor-pointer flex-1"
                  >
                    <Trans>Start Processing</Trans>
                  </button>
                )}
                {order.status === 'processing' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateOrderStatus(order.id, 'completed')
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:cursor-pointer flex-1"
                  >
                    <Trans>Mark as Completed</Trans>
                  </button>
                )}
                {(order.status === 'pending' ||
                  order.status === 'processing') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateOrderStatus(order.id, 'cancelled')
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:cursor-pointer flex-1"
                  >
                    <Trans>Cancel Order</Trans>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </PageLayout>
  )
}
