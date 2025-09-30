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
      return 'Ваш заказ подтвержден'
    case 'processing':
      return 'Ваш заказ обрабатывается'
    case 'ready':
      return 'Ваш заказ готов'
    case 'delivered':
      return 'Ваш заказ доставлен'
    case 'cancelled':
      return 'Ваш заказ отменен'
    default:
      return 'Обновление статуса заказа'
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
        <title>Обновление заказа</title>
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
                <p>Обновление статуса вашего заказа</p>
            </div>

            <div class="content">
                <h2>Здравствуйте, ${data.guestName}!</h2>

                <p>Статус вашего заказа изменился:</p>

                <div class="order-details">
                    <h3>Детали заказа</h3>
                    <p><strong>Номер заказа:</strong> ${data.orderId}</p>
                    <p><strong>Статус:</strong> <span class="status-badge">${statusMessage}</span></p>
                    <p><strong>Фотограф:</strong> ${data.photographerName}</p>
                    ${data.orderSummary ? `<p><strong>Описание:</strong> ${data.orderSummary}</p>` : ''}
                </div>

                ${getStatusSpecificContent(data.newStatus)}

                <div class="footer">
                    <p>Спасибо за выбор ${data.studioName}!</p>
                    <p>По вопросам обращайтесь к вашему фотографу: ${data.photographerName}</p>
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
      return 'Подтвержден'
    case 'processing':
      return 'Обрабатывается'
    case 'ready':
      return 'Готов'
    case 'delivered':
      return 'Доставлен'
    case 'cancelled':
      return 'Отменен'
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
        <p>Ваш заказ успешно подтвержден и передан в обработку. Мы приступили к подготовке ваших фотографий.</p>
      `
    case 'processing':
      return `
        <p>Ваши фотографии обрабатываются. Скоро они будут готовы для загрузки или печати.</p>
      `
    case 'ready':
      return `
        <p>🎉 Отличные новости! Ваш заказ готов. Вы можете забрать его или загрузить фотографии.</p>
      `
    case 'delivered':
      return `
        <p>✅ Ваш заказ успешно доставлен. Надеемся, вам понравились ваши фотографии!</p>
        <p>Будем рады видеть вас снова!</p>
      `
    case 'cancelled':
      return `
        <p>К сожалению, ваш заказ был отменен. Если у вас есть вопросы, пожалуйста, свяжитесь с нами.</p>
      `
    default:
      return `
        <p>Статус вашего заказа обновлен. За дополнительной информацией обращайтесь к фотографу.</p>
      `
  }
}
