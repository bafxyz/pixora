import crypto from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { notifyPaymentReceived } from '@/lib/services/notification.service'
import { prisma } from '@/shared/lib/prisma/client'

const ROBOKASSA_PASSWORD_2 = process.env.ROBOKASSA_PASSWORD_2 || ''

function verifyRobokassaSignature(
  outSum: string,
  invId: string,
  signatureValue: string,
  password: string
): boolean {
  const expectedSignature = crypto
    .createHash('md5')
    .update(`${outSum}:${invId}:${password}`)
    .digest('hex')
    .toUpperCase()

  return signatureValue.toUpperCase() === expectedSignature
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const outSum = formData.get('OutSum') as string
    const invId = formData.get('InvId') as string
    const signatureValue = formData.get('SignatureValue') as string

    if (process.env.NODE_ENV === 'development') {
      console.log('Robokassa callback received:', {
        outSum,
        invId,
        signatureValue,
      })
    }

    // Verify signature
    if (
      !verifyRobokassaSignature(
        outSum,
        invId,
        signatureValue,
        ROBOKASSA_PASSWORD_2
      )
    ) {
      console.error('Invalid Robokassa signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: invId },
      include: {
        photographer: true,
        studio: true,
      },
    })

    if (!order) {
      console.error('Order not found:', invId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'paid',
        status: 'pending', // Waiting for photographer/admin to process
      },
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('Order payment confirmed:', order.id)
    }

    // Send payment notification
    await notifyPaymentReceived(order.id)

    return new NextResponse(`OK${invId}`, { status: 200 })
  } catch (error) {
    console.error('Robokassa callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET request for Result URL
export async function GET(request: NextRequest) {
  return POST(request)
}
