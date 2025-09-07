import { type NextRequest, NextResponse } from 'next/server'
import { type OrderEmailData, sendOrderConfirmation } from '@/shared/lib/email'

export async function POST(request: NextRequest) {
  try {
    const emailData: OrderEmailData = await request.json()

    // Validate required fields
    if (!emailData.orderId || !emailData.guestEmail || !emailData.items) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await sendOrderConfirmation(emailData)

    return NextResponse.json({
      success: true,
      message: 'Order confirmation email sent successfully',
    })
  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    return NextResponse.json(
      { error: 'Failed to send order confirmation email' },
      { status: 500 }
    )
  }
}
