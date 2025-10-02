import { type NextRequest, NextResponse } from 'next/server'
import { notifyNewOrder } from '@/lib/services/notification.service'
import { prisma } from '@/shared/lib/prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      guestEmail,
      guestName,
      guestPhone,
      items,
      paymentMethod,
    } = body

    // Validation
    if (
      !sessionId ||
      !guestEmail ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['cash', 'tinkoff'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Validate items structure
    for (const item of items) {
      if (!item.photoId || !item.productType || !item.quantity || !item.price) {
        return NextResponse.json(
          { error: 'Invalid item structure' },
          { status: 400 }
        )
      }
      if (!['print', 'magnet', 'digital'].includes(item.productType)) {
        return NextResponse.json(
          { error: 'Invalid product type' },
          { status: 400 }
        )
      }
    }

    const photoIds = items.map((item: { photoId: string }) => item.photoId)

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

    // Calculate total amount from items
    const totalAmount = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    )
    const discount = 0 // No discount for now
    const finalAmount = totalAmount

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
          create: items.map(
            (item: {
              photoId: string
              productType: 'print' | 'magnet' | 'digital'
              quantity: number
              price: number
            }) => ({
              photoId: item.photoId,
              productType: item.productType,
              quantity: item.quantity,
              price: item.price,
            })
          ),
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

    // If Tinkoff payment, generate payment link
    if (paymentMethod === 'tinkoff') {
      // TODO: Implement Tinkoff payment integration
      // For now, return error as not implemented
      return NextResponse.json(
        { error: 'Tinkoff payment not implemented yet' },
        { status: 501 }
      )
    }

    // Send notification for new order
    await notifyNewOrder(order.id)

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
