import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderNotificationData {
  guestName: string
  guestEmail: string
  orderId: string
  newStatus: string
  photographerName: string
  studioName: string
  orderSummary?: string
}

export async function sendOrderStatusNotification(data: OrderNotificationData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email notification')
    return { success: false, error: 'Email service not configured' }
  }

  if (!data.guestEmail) {
    console.warn('Guest email not provided, skipping email notification')
    return { success: false, error: 'Guest email not provided' }
  }

  try {
    const subject = getEmailSubject(data.newStatus)
    const htmlContent = getEmailContent(data)

    const result = await resend.emails.send({
      from: `${data.studioName} <noreply@${process.env.EMAIL_DOMAIN || 'pixora.app'}>`,
      to: [data.guestEmail],
      subject: subject,
      html: htmlContent,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send order notification email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

function getEmailSubject(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'Your order has been confirmed'
    case 'processing':
      return 'Your order is being processed'
    case 'ready':
      return 'Your order is ready'
    case 'delivered':
      return 'Your order has been delivered'
    case 'cancelled':
      return 'Your order has been cancelled'
    default:
      return 'Order status update'
  }
}

function getEmailContent(data: OrderNotificationData): string {
  const statusMessage = getStatusMessage(data.newStatus)
  const statusColor = getStatusColor(data.newStatus)

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Update</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; background-color: ${statusColor}; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📸 ${data.studioName}</h1>
                 <p>Your order status has been updated</p>
            </div>

            <div class="content">
                 <h2>Hello, ${data.guestName}!</h2>

                 <p>Your order status has changed:</p>

                <div class="order-details">
                     <h3>Order Details</h3>
                     <p><strong>Order Number:</strong> ${data.orderId}</p>
                     <p><strong>Status:</strong> <span class="status-badge">${statusMessage}</span></p>
                     <p><strong>Photographer:</strong> ${data.photographerName}</p>
                     ${data.orderSummary ? `<p><strong>Description:</strong> ${data.orderSummary}</p>` : ''}
                </div>

                ${getStatusSpecificContent(data.newStatus)}

                <div class="footer">
                     <p>Thank you for choosing ${data.studioName}!</p>
                     <p>For questions, contact your photographer: ${data.photographerName}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `
}

function getStatusMessage(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'Confirmed'
    case 'processing':
      return 'Processing'
    case 'ready':
      return 'Ready'
    case 'delivered':
      return 'Delivered'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return '#3b82f6'
    case 'processing':
      return '#f59e0b'
    case 'ready':
      return '#10b981'
    case 'delivered':
      return '#059669'
    case 'cancelled':
      return '#ef4444'
    default:
      return '#6b7280'
  }
}

function getStatusSpecificContent(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return `
        <p>Your order has been successfully confirmed and is now being processed. We have started preparing your photos.</p>
      `
    case 'processing':
      return `
        <p>Your photos are being processed. They will soon be ready for download or printing.</p>
      `
    case 'ready':
      return `
        <p>🎉 Great news! Your order is ready. You can pick it up or download your photos.</p>
      `
    case 'delivered':
      return `
        <p>✅ Your order has been successfully delivered. We hope you enjoyed your photos!</p>
        <p>We look forward to seeing you again!</p>
      `
    case 'cancelled':
      return `
        <p>Unfortunately, your order has been cancelled. If you have any questions, please contact us.</p>
      `
    default:
      return `
        <p>Your order status has been updated. For additional information, contact your photographer.</p>
      `
  }
}
