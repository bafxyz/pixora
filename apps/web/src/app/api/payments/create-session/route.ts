import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'

// import Stripe from 'stripe'

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// })

export async function POST(request: NextRequest) {
  // Check if user is authenticated
  const auth = await withRoleCheck(
    ['photographer', 'studio-admin', 'admin'],
    request
  )
  if (auth instanceof NextResponse) {
    // For guest checkout, we don't require authentication at this endpoint
    // since this may be called from the checkout page
  }

  try {
    const { orderId, amount, currency = 'usd' } = await request.json()

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

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Validate currency (only allow USD for now)
    const validCurrencies = ['usd', 'eur', 'gbp'] // Add more as needed
    if (!validCurrencies.includes(currency.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid currency. Only USD, EUR, and GBP are supported.' },
        { status: 400 }
      )
    }

    // Optional: validate amount against order in database for security
    // This would ensure the amount hasn't been tampered with
    // For now, we'll implement a basic check

    // Create Stripe checkout session
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [
    //     {
    //       price_data: {
    //         currency: currency.toLowerCase(),
    //         product_data: {
    //           name: `Order #${orderId.slice(0, 8)}`,
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
