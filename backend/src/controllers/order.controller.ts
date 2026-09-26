import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orders/order.service';
import { QrService } from '../services/qr/qr.service';

export class OrderController {
  static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { order, user } = req.body;
      if (!order || !user) {
        res.status(400).json({ error: 'Order and user payloads are required' });
        return;
      }
      const result = await OrderService.processNewOrder(order, user);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }

  static async getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = req.params.id as string;
      const pdfBuffer = await OrderService.getReceiptPdf(orderId);
      if (!pdfBuffer) {
        res.status(404).send(`
          <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h1>Receipt Not Found or Expired</h1>
              <p>Receipts are available for 24 hours after ordering.</p>
            </body>
          </html>
        `);
        return;
      }
      const shortOrderId = orderId.includes('-') ? orderId.split('-')[1] : orderId;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=Receipt_${shortOrderId}.pdf`);
      res.send(pdfBuffer);
    } catch (e) {
      next(e);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { order, newStatus, user } = req.body;
      if (!user || !user.email) {
        res.status(400).json({ error: 'User email is required' });
        return;
      }
      const result = await OrderService.updateOrderStatus(order, newStatus, user);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }

  static async verifyVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { qrToken } = req.body;
      if (!qrToken) {
        res.status(400).json({ error: 'qrToken is required' });
        return;
      }
      const verification = QrService.verifyAndRedeemToken(qrToken);
      if (!verification.isValid) {
        res.status(400).json({ success: false, error: verification.error });
        return;
      }
      res.json({ success: true, orderId: verification.orderId, message: 'Voucher verified and redeemed successfully!' });
    } catch (e) {
      next(e);
    }
  }
}
