import crypto from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/services/notification.service'
import { prisma } from '@/shared/lib/prisma/client'

// Robokassa configuration
const ROBOKASSA_LOGIN = process.env.ROBOKASSA_LOGIN || ''
const ROBOKASSA_PASSWORD_1 = process.env.ROBOKASSA_PASSWORD_1 || ''
const ROBOKASSA_TEST_MODE = process.env.ROBOKASSA_TEST_MODE === 'true'

function generateRobokassaSignature(
  login: string,
  outSum: string,
  invId: string,
  password: string
): string {
  const signatureString = `${login}:${outSum}:${invId}:${password}`
  return crypto.createHash('md5').update(signatureString).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      guestEmail,
      guestName,
      guestPhone,
      photoIds,
      paymentMethod,
    } = body

    // Validation
    if (
      !sessionId ||
      !guestEmail ||
      !photoIds ||
      !Array.isArray(photoIds) ||
      photoIds.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['cash', 'robokassa'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Get session with studio and photographer info
    const session = await prisma.photoSession.findUnique({
      where: { id: sessionId },
      include: {
        studio: true,
        photographer: true,
        photos: {
          where: {
            id: { in: photoIds },
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if all photos exist and belong to this session
    if (session.photos.length !== photoIds.length) {
      return NextResponse.json(
        { error: 'Some photos not found in this session' },
        { status: 400 }
      )
    }

    // Calculate pricing
    const pricePerPhoto = 5.0 // TODO: Get from settings
    const bulkDiscountThreshold = 20 // TODO: Get from settings
    const bulkDiscountPercent = 15 // TODO: Get from settings

    const photoCount = photoIds.length
    const totalAmount = photoCount * pricePerPhoto
    let discount = 0

    if (photoCount >= bulkDiscountThreshold) {
      discount = (totalAmount * bulkDiscountPercent) / 100
    }

    const finalAmount = totalAmount - discount

    // Create order
    const order = await prisma.order.create({
      data: {
        studioId: session.studioId,
        photographerId: session.photographerId,
        sessionId: session.id,
        guestEmail,
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        paymentMethod,
        totalAmount,
        discount,
        finalAmount,
        status: 'pending',
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
        items: {
          create: photoIds.map((photoId) => ({
            photoId,
            price: pricePerPhoto,
          })),
        },
      },
      include: {
        items: {
          include: {
            photo: true,
          },
        },
      },
    })

    // If Robokassa payment, generate payment link
    if (paymentMethod === 'robokassa') {
      const invId = order.id
      const outSum = finalAmount.toFixed(2)
      const description = `Order ${order.id.substring(0, 8)} - ${photoCount} photos`

      const signature = generateRobokassaSignature(
        ROBOKASSA_LOGIN,
        outSum,
        invId,
        ROBOKASSA_PASSWORD_1
      )

      const paymentUrl = ROBOKASSA_TEST_MODE
        ? 'https://auth.robokassa.ru/Merchant/Index.aspx'
        : 'https://auth.robokassa.ru/Merchant/Index.aspx'

      const paymentParams = new URLSearchParams({
        MerchantLogin: ROBOKASSA_LOGIN,
        OutSum: outSum,
        InvId: invId,
        Description: description,
        SignatureValue: signature,
        Email: guestEmail,
        Culture: 'en',
        Encoding: 'utf-8',
        IsTest: ROBOKASSA_TEST_MODE ? '1' : '0',
      })

      const paymentLink = `${paymentUrl}?${paymentParams.toString()}`

      // Update order with Robokassa data
      await prisma.order.update({
        where: { id: order.id },
        data: {
          robokassaInvoiceId: invId,
          robokassaPaymentLink: paymentLink,
        },
      })

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          finalAmount: order.finalAmount,
          paymentMethod: order.paymentMethod,
          paymentLink,
        },
      })
    }

    // Send notification for new order
    await NotificationService.notifyNewOrder(order.id)

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        finalAmount: order.finalAmount,
        paymentMethod: order.paymentMethod,
      },
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
