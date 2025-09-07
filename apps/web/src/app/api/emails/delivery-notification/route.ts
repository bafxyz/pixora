import { type NextRequest, NextResponse } from 'next/server'
import {
  type DeliveryEmailData,
  sendDeliveryNotification,
} from '@/shared/lib/email'

export async function POST(request: NextRequest) {
  try {
    const emailData: DeliveryEmailData = await request.json()

    // Validate required fields
    if (!emailData.orderId || !emailData.guestEmail || !emailData.deliveryUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await sendDeliveryNotification(emailData)

    return NextResponse.json({
      success: true,
      message: 'Delivery notification email sent successfully',
    })
  } catch (error) {
    console.error('Error sending delivery notification email:', error)
    return NextResponse.json(
      { error: 'Failed to send delivery notification email' },
      { status: 500 }
    )
  }
}
