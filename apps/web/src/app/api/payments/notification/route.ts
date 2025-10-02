import crypto from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { notifyPaymentReceived } from '@/lib/services/notification.service'
import { prisma } from '@/shared/lib/prisma/client'

const TINKOFF_SECRET_KEY = process.env.TINKOFF_SECRET_KEY || ''

interface TinkoffNotification {
  TerminalKey: string
  OrderId: string
  Success: boolean
  Status: string
  PaymentId: string
  ErrorCode: string
  Amount: number
  RebillId?: string
  CardId?: string
  Pan?: string
  Token: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const notification: TinkoffNotification = body

    // Verify token
    const generateToken = (data: Record<string, string | number>): string => {
      const sortedKeys = Object.keys(data).sort()
      const tokenString = sortedKeys.map((key) => `${key}${data[key]}`).join('')
      return crypto
        .createHash('sha256')
        .update(tokenString + TINKOFF_SECRET_KEY)
        .digest('hex')
    }

    const expectedToken = generateToken({ ...body, Token: '' })
    if (notification.Token !== expectedToken) {
      console.error('Invalid token in Tinkoff notification')
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: notification.OrderId },
    })

    if (!order) {
      console.error('Order not found:', notification.OrderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order status based on payment status
    if (notification.Success && notification.Status === 'CONFIRMED') {
      await prisma.order.update({
        where: { id: notification.OrderId },
        data: {
          paymentStatus: 'paid',
          status: 'processing',
          processedAt: new Date(),
        },
      })

      // Send payment notification
      await notifyPaymentReceived(order.id)
    } else if (
      notification.Status === 'REJECTED' ||
      notification.Status === 'CANCELED'
    ) {
      await prisma.order.update({
        where: { id: notification.OrderId },
        data: {
          paymentStatus: 'failed',
        },
      })
    }

    return NextResponse.json({ OK: true })
  } catch (error) {
    console.error('Payment notification error:', error)
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    )
  }
}
