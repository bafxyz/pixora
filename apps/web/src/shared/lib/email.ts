import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface OrderEmailData {
  orderId: string
  guestName: string
  guestEmail: string
  photographerName: string
  studioName: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  totalAmount: number
  orderDate: string
}

export interface DeliveryEmailData {
  orderId: string
  guestName: string
  guestEmail: string
  photographerName: string
  studioName: string
  deliveryUrl: string
}

export async function sendOrderConfirmation(
  data: OrderEmailData
): Promise<void> {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'Pixora <orders@pixora.app>',
      to: [data.guestEmail],
      subject: `Order Confirmation - ${data.orderId}`,
      html: generateOrderConfirmationHTML(data),
    })

    if (error) {
      console.error('Failed to send order confirmation email:', error)
      throw new Error('Failed to send order confirmation email')
    }

    console.log('Order confirmation email sent successfully:', emailData)
  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    throw error
  }
}

export async function sendDeliveryNotification(
  data: DeliveryEmailData
): Promise<void> {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'Pixora <deliveries@pixora.app>',
      to: [data.guestEmail],
      subject: `Your Photos Are Ready! - ${data.orderId}`,
      html: generateDeliveryNotificationHTML(data),
    })

    if (error) {
      console.error('Failed to send delivery notification email:', error)
      throw new Error('Failed to send delivery notification email')
    }

    console.log('Delivery notification email sent successfully:', emailData)
  } catch (error) {
    console.error('Error sending delivery notification email:', error)
    throw error
  }
}

function generateOrderConfirmationHTML(data: OrderEmailData): string {
  const itemsHTML = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
        </tr>
      `
    )
    .join('')

  return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Pixora</h1>
            <p style="color: #6b7280; margin: 5px 0;">Photo Studio Platform</p>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">Order Confirmation</h2>
            <p>Hi ${data.guestName},</p>
            <p>Thank you for your order! Your photos have been successfully ordered from ${data.studioName}.</p>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #1f2937;">Order Details</h3>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Studio:</strong> ${data.studioName}</p>
            <p><strong>Photographer:</strong> ${data.photographerName}</p>
            <p><strong>Order Date:</strong> ${data.orderDate ? new Date(data.orderDate).toLocaleDateString() : 'N/A'}</p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Quantity</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
              <tfoot>
                <tr style="background: #f8fafc; font-weight: bold;">
                  <td colspan="2" style="padding: 10px; text-align: right;">Total:</td>
                  <td style="padding: 10px; text-align: right;">$${data.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #92400e;">What's Next?</h4>
            <p style="margin-bottom: 0; color: #92400e;">
              Your photographer will start working on your photos. You'll receive an email notification when your photos are ready for download.
            </p>
          </div>

          <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>This is an automated message from Pixora. Please do not reply to this email.</p>
            <p>If you have any questions, please contact your photographer directly.</p>
          </div>
        </body>
      </html>
    `
}

function generateDeliveryNotificationHTML(data: DeliveryEmailData): string {
  return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your Photos Are Ready</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Pixora</h1>
            <p style="color: #6b7280; margin: 5px 0;">Photo Studio Platform</p>
          </div>

          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #065f46; margin-top: 0;">🎉 Your Photos Are Ready!</h2>
            <p>Hi ${data.guestName},</p>
            <p>Great news! Your photos from ${data.studioName} are now ready for download.</p>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <h3 style="margin-top: 0; color: #1f2937;">Download Your Photos</h3>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Studio:</strong> ${data.studioName}</p>
            <p><strong>Photographer:</strong> ${data.photographerName}</p>

            <div style="margin: 30px 0;">
              <a href="${data.deliveryUrl}"
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                📸 Download Photos
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              This link will be available for 30 days. Make sure to download your photos before it expires.
            </p>
          </div>

          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #0c4a6e;">Need Help?</h4>
            <p style="margin-bottom: 0; color: #0c4a6e;">
              If you have any questions about your photos or need assistance, please contact ${data.photographerName} at the studio.
            </p>
          </div>

          <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>This is an automated message from Pixora. Please do not reply to this email.</p>
            <p>Thank you for choosing ${data.studioName} for your photography needs!</p>
          </div>
        </body>
      </html>
    `
}
