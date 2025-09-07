import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { AlertCircle, CheckCircle, Send } from 'lucide-react'
import React, { useState } from 'react'

interface Order {
  id: string
  guestId: string
  guestName: string
  guestEmail: string
  status: string
  totalAmount: number
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}

interface DeliveryNotificationProps {
  order: Order
  photographerName: string
  studioName: string
  onNotificationSent: () => void
}

export function DeliveryNotification({
  order,
  photographerName,
  studioName,
  onNotificationSent,
}: DeliveryNotificationProps) {
  const [deliveryUrl, setDeliveryUrl] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  )
  const [errorMessage, setErrorMessage] = useState('')

  const handleSendNotification = async () => {
    if (!deliveryUrl.trim()) {
      setErrorMessage('Please provide a delivery URL')
      return
    }

    setIsSending(true)
    setSendStatus('idle')
    setErrorMessage('')

    try {
      const emailData = {
        orderId: order.id,
        guestName: order.guestName,
        guestEmail: order.guestEmail,
        photographerName,
        studioName,
        deliveryUrl: deliveryUrl.trim(),
      }

      const response = await fetch('/api/emails/delivery-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      if (response.ok) {
        setSendStatus('success')
        onNotificationSent()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send notification')
      }
    } catch (error) {
      console.error('Error sending delivery notification:', error)
      setSendStatus('error')
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to send notification'
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Send Delivery Notification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Order Details</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              <strong>Order ID:</strong> {order.id}
            </p>
            <p>
              <strong>Guest:</strong> {order.guestName}
            </p>
            <p>
              <strong>Email:</strong> {order.guestEmail}
            </p>
            <p>
              <strong>Items:</strong> {order.items.length} photo
              {order.items.length > 1 ? 's' : ''}
            </p>
            <p>
              <strong>Total:</strong> ${order.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery-url">Delivery URL</Label>
          <Input
            id="delivery-url"
            type="url"
            placeholder="https://example.com/download/order-123"
            value={deliveryUrl}
            onChange={(e) => setDeliveryUrl(e.target.value)}
            disabled={isSending}
          />
          <p className="text-sm text-gray-600">
            Provide a link where the guest can download their photos
          </p>
        </div>

        {sendStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">
                Notification sent successfully!
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              The guest has been notified that their photos are ready for
              download.
            </p>
          </div>
        )}

        {sendStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Failed to send notification</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          </div>
        )}

        <Button
          onClick={handleSendNotification}
          disabled={isSending || !deliveryUrl.trim()}
          className="w-full"
        >
          {isSending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Delivery Notification
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
