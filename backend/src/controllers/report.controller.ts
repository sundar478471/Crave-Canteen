import { Request, Response, NextFunction } from 'express';
import { PdfService } from '../services/pdf/pdf.service';
import { EmailService } from '../services/notifications/email/email.service';

export class ReportController {
  static async sendReportEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name, stats } = req.body;
      if (!email || !name || !stats) {
        res.status(400).json({ error: 'Email, name, and stats are required' });
        return;
      }

      const pdfBuffer = await PdfService.generateFinancialReportPdf(name, email, stats);
      const emailResult = await EmailService.sendReportEmail(email, name, pdfBuffer);

      res.json({ success: true, message: 'Report email sent successfully', previewUrl: emailResult.previewUrl });
    } catch (e) {
      next(e);
    }
  }
}
