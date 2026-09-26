import { EmailService } from './email/email.service';
import { WhatsappService } from './whatsapp/whatsapp.service';

export class NotificationService {
  static async sendOrderNotifications(order: any, user: any, pdfBuffer: Buffer) {
    let emailPreviewUrl: string | null = null;
    let whatsappResult = { isMock: true, whatsappError: null as string | null };

    if (user.email) {
      try {
        const emailRes = await EmailService.sendReceiptEmail(user.email, user.name, order.id, pdfBuffer);
        emailPreviewUrl = emailRes.previewUrl;
      } catch (err) {
        console.error('Email Dispatch Error:', err);
      }
    }

    if (user.phoneNumber) {
      const itemsSummary = order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ');
      const shortOrderId = order.id.includes('-') ? order.id.split('-')[1] : order.id;
      const message = `Order #${shortOrderId} Placed! ${itemsSummary}. Total: Rs. ${order.total}. Time: ${new Date(order.timestamp || Date.now()).toLocaleTimeString()}.`;
      const res = await WhatsappService.sendWhatsappMessage(user.phoneNumber, message);
      whatsappResult = { isMock: res.isMock, whatsappError: res.whatsappError || null };
    }

    return { emailPreviewUrl, isMockWhatsApp: whatsappResult.isMock, whatsappError: whatsappResult.whatsappError };
  }

  static async sendStatusUpdateNotifications(order: any, newStatus: string, user: any) {
    let emailPreviewUrl: string | null = null;
    let whatsappResult = { isMock: true, whatsappError: null as string | null };

    if (user.email) {
      try {
        const emailRes = await EmailService.sendStatusUpdateEmail(user.email, user.name, order.id, newStatus);
        emailPreviewUrl = emailRes.previewUrl;
      } catch (err) {
        console.error('Status Update Email Error:', err);
      }
    }

    if (user.phoneNumber) {
      const shortOrderId = order.id.includes('-') ? order.id.split('-')[1] : order.id;
      const message = `Crave Canteen: Your order #${shortOrderId} is now ${newStatus}.`;
      const res = await WhatsappService.sendWhatsappMessage(user.phoneNumber, message);
      whatsappResult = { isMock: res.isMock, whatsappError: res.whatsappError || null };
    }

    return { emailPreviewUrl, isMockWhatsApp: whatsappResult.isMock, whatsappError: whatsappResult.whatsappError };
  }
}
