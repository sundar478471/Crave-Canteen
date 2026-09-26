import { PdfService } from '../pdf/pdf.service';
import { NotificationService } from '../notifications/notification.service';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export class OrderService {
  static async processNewOrder(order: any, user: any) {
    const pdfBuffer = await PdfService.generateOrderReceiptPdf(order, user);
    const notifications = await NotificationService.sendOrderNotifications(order, user, pdfBuffer);
    const shortOrderId = order.id.includes('-') ? order.id.split('-')[1] : order.id;
    const itemsSummary = order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ');
    const message = `Order #${shortOrderId} Placed! ${itemsSummary}. Total: Rs. ${order.total}.`;

    return {
      success: true,
      message,
      emailPreviewUrl: notifications.emailPreviewUrl,
      isMockWhatsApp: notifications.isMockWhatsApp,
      whatsappError: notifications.whatsappError,
    };
  }

  static async getReceiptPdf(orderId: string): Promise<Buffer | null> {
    let pdfBuffer = PdfService.getCachedReceipt(orderId);
    if (!pdfBuffer) {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          const order = orderDoc.data();
          let user = { name: order.userName || 'Customer', email: 'N/A' };
          if (order.userId) {
            const userDoc = await getDoc(doc(db, 'users', order.userId));
            if (userDoc.exists()) user = userDoc.data() as any;
          }
          pdfBuffer = await PdfService.generateOrderReceiptPdf({ ...order, id: orderId }, user);
        }
      } catch (e) {
        console.error('Fallback Firestore fetch for receipt failed:', e);
      }
    }
    return pdfBuffer;
  }

  static async updateOrderStatus(order: any, newStatus: string, user: any) {
    const notifications = await NotificationService.sendStatusUpdateNotifications(order, newStatus, user);
    return {
      success: true,
      emailPreviewUrl: notifications.emailPreviewUrl,
      isMockWhatsApp: notifications.isMockWhatsApp,
      whatsappError: notifications.whatsappError,
    };
  }
}
