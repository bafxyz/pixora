import { prisma } from '@/shared/lib/prisma/client';
import type { NotificationType } from '@prisma/client';

interface CreateNotificationInput {
  type: NotificationType;
  recipientEmail: string;
  orderId: string;
  title: string;
  message: string;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: input,
    });
  }

  /**
   * Send notification for new order (photographer + admin)
   */
  static async notifyNewOrder(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          photographer: true,
          session: true,
          items: true,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const photoCount = order.items.length;
      const title = `New Order: ${photoCount} photo${photoCount > 1 ? 's' : ''}`;
      const message = `Guest ${order.guestEmail} ordered ${photoCount} photos from session "${order.session.name}". Total: $${order.finalAmount}`;

      // Notify photographer
      await this.create({
        type: 'new_order',
        recipientEmail: order.photographer.email,
        orderId: order.id,
        title,
        message,
      });

      console.log(`✅ Notification sent to photographer: ${order.photographer.email}`);

      return { success: true };
    } catch (error) {
      console.error('Failed to send new order notification:', error);
      return { success: false, error };
    }
  }

  /**
   * Send notification when payment is received
   */
  static async notifyPaymentReceived(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          photographer: true,
          session: true,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const title = 'Payment Received';
      const message = `Payment of $${order.finalAmount} received for order ${order.id.slice(0, 8)} from ${order.guestEmail}`;

      await this.create({
        type: 'payment_received',
        recipientEmail: order.photographer.email,
        orderId: order.id,
        title,
        message,
      });

      console.log(`✅ Payment notification sent to: ${order.photographer.email}`);

      return { success: true };
    } catch (error) {
      console.error('Failed to send payment notification:', error);
      return { success: false, error };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get unread notifications for a user
   */
  static async getUnread(email: string) {
    return prisma.notification.findMany({
      where: {
        recipientEmail: email,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all notifications for a user
   */
  static async getAll(email: string, limit = 50) {
    return prisma.notification.findMany({
      where: { recipientEmail: email },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}