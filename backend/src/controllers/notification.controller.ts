import { Request, Response, NextFunction } from 'express';
import { WhatsappService } from '../services/notifications/whatsapp/whatsapp.service';

export class NotificationController {
  static async sendWhatsapp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phoneNumber, message } = req.body;
      if (!phoneNumber || !message) {
        res.status(400).json({ error: 'PhoneNumber and message are required' });
        return;
      }
      const result = await WhatsappService.sendWhatsappMessage(phoneNumber, message);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
}
