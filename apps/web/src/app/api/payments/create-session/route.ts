import crypto from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'

// Tinkoff API configuration
const TINKOFF_TERMINAL_KEY = process.env.TINKOFF_TERMINAL_KEY || ''
const TINKOFF_SECRET_KEY = process.env.TINKOFF_SECRET_KEY || ''
const TINKOFF_API_URL = 'https://securepay.tinkoff.ru/v2/Init'

interface TinkoffInitRequest {
  TerminalKey: string
  Amount: number
  OrderId: string
  Description: string
  DATA?: string
  Receipt?: {
    Email?: string
    Phone?: string
    Taxation: string
    Items: Array<{
      Name: string
      Price: number
      Quantity: number
      Amount: number
      Tax: string
    }>
  }
  SuccessURL: string
  FailURL: string
  NotificationURL: string
  Token: string
}

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    // Validate inputs
    if (
      !orderId ||
      typeof orderId !== 'string' ||
      orderId.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'Valid order ID is required' },
        { status: 400 }
      )
    }

    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            photo: {
              select: {
                fileName: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Convert amount to kopecks (Tinkoff uses smallest currency unit)
    const amountInKopecks = Math.round(Number(order.finalAmount) * 100)

    // Generate token for Tinkoff API
    const generateToken = (data: Record<string, string | number>): string => {
      const sortedKeys = Object.keys(data).sort()
      const tokenString = sortedKeys.map((key) => `${key}${data[key]}`).join('')
      return crypto
        .createHash('sha256')
        .update(tokenString + TINKOFF_SECRET_KEY)
        .digest('hex')
    }

    // Prepare receipt for Tinkoff (if required)
    const receipt = {
      Email: order.guestEmail,
      Taxation: 'osn',
      Items: order.items.map((item) => ({
        Name: `Photo: ${item.photo.fileName}`,
        Price: Math.round(Number(item.price) * 100), // Convert to kopecks
        Quantity: 1,
        Amount: Math.round(Number(item.price) * 100), // Convert to kopecks
        Tax: 'none',
      })),
    }

    // Prepare request data
    const requestData: TinkoffInitRequest = {
      TerminalKey: TINKOFF_TERMINAL_KEY,
      Amount: amountInKopecks,
      OrderId: orderId,
      Description: `Payment for order #${orderId.slice(0, 8)}`,
      Receipt: receipt,
      SuccessURL: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?orderId=${orderId}`,
      FailURL: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancelled?orderId=${orderId}`,
      NotificationURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/notification`,
      Token: '',
    }

    // Generate token
    requestData.Token = generateToken({
      ...requestData,
      Receipt: JSON.stringify(receipt),
    })

    // Make request to Tinkoff API
    const response = await fetch(TINKOFF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      console.error('Tinkoff API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Payment provider error' },
        { status: 500 }
      )
    }

    const tinkoffResponse = await response.json()

    if (tinkoffResponse.ErrorCode !== '0') {
      console.error('Tinkoff payment error:', tinkoffResponse)
      return NextResponse.json(
        {
          error: tinkoffResponse.Details || 'Failed to create payment session',
        },
        { status: 400 }
      )
    }

    // Update order with Tinkoff payment ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        tinkoffPaymentId: tinkoffResponse.PaymentId,
        tinkoffPaymentLink: tinkoffResponse.PaymentURL,
      },
    })

    return NextResponse.json({
      sessionId: tinkoffResponse.PaymentId,
      url: tinkoffResponse.PaymentURL,
      orderId,
    })
  } catch (error) {
    console.error('Payment session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}
