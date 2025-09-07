import { type NextRequest, NextResponse } from 'next/server'
// import Stripe from 'stripe'

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// })

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount } = await request.json()

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Order ID and amount are required' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [
    //     {
    //       price_data: {
    //         currency,
    //         product_data: {
    //           name: `Order #${orderId.slice(-8)}`,
    //           description: 'Photo order payment',
    //         },
    //         unit_amount: Math.round(amount * 100), // Convert to cents
    //       },
    //       quantity: 1,
    //     },
    //   ],
    //   mode: 'payment',
    //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancelled`,
    //   metadata: {
    //     orderId,
    //   },
    // })

    // For now, return a mock response
    const mockSession = {
      id: `cs_mock_${Date.now()}`,
      url: `/payment/success?session_id=cs_mock_${Date.now()}`,
    }

    return NextResponse.json({
      sessionId: mockSession.id,
      url: mockSession.url,
    })
  } catch (error) {
    console.error('Payment session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}
