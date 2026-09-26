import nodemailer from 'nodemailer';
import { config } from '../../../config/env';

let cachedTransporter: nodemailer.Transporter | null = null;
let testAccount: nodemailer.TestAccount | null = null;

export class EmailService {
  private static async getTransporter(): Promise<nodemailer.Transporter> {
    if (cachedTransporter) return cachedTransporter;

    if (config.smtp.user && config.smtp.pass) {
      const transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });

      try {
        await transporter.verify();
        cachedTransporter = transporter;
        return transporter;
      } catch (error: any) {
        console.error('SMTP Verification Error:', error.message);
        console.warn('⚠️ WARNING: Falling back to Ethereal test account.');
      }
    }

    if (!testAccount) {
      testAccount = await nodemailer.createTestAccount();
    }

    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    return cachedTransporter;
  }

  static async sendReceiptEmail(userEmail: string, userName: string, orderId: string, pdfBuffer: Buffer) {
    const transporter = await this.getTransporter();
    const shortOrderId = orderId.includes('-') ? orderId.split('-')[1] : orderId;

    const info = await transporter.sendMail({
      from: `"Crave Canteen" <${config.smtp.user || testAccount?.user || 'test@cravecanteen.com'}>`,
      to: userEmail,
      subject: `Order Receipt - #${shortOrderId}`,
      text: `Hello ${userName}, your receipt for order #${shortOrderId} is attached.`,
      attachments: [
        {
          filename: `Receipt_${shortOrderId}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    let previewUrl: string | null = null;
    if (!(config.smtp.user && config.smtp.pass)) {
      previewUrl = nodemailer.getTestMessageUrl(info) || null;
    }

    return { messageId: info.messageId, previewUrl };
  }

  static async sendStatusUpdateEmail(userEmail: string, userName: string, orderId: string, newStatus: string) {
    const transporter = await this.getTransporter();
    const shortOrderId = orderId.includes('-') ? orderId.split('-')[1] : orderId;

    const info = await transporter.sendMail({
      from: `"Crave Canteen" <${config.smtp.user || testAccount?.user || 'test@cravecanteen.com'}>`,
      to: userEmail,
      subject: `Order Update - #${shortOrderId} is now ${newStatus}`,
      text: `Hello ${userName},\n\nYour order #${shortOrderId} status has been updated to: ${newStatus}.\n\nThank you for choosing Crave Canteen!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #9333ea;">Crave Canteen Order Update</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Your order <strong>#${shortOrderId}</strong> status has been updated to: <strong style="color: #10b981;">${newStatus}</strong>.</p>
          <p>Thank you for choosing Crave Canteen!</p>
        </div>
      `,
    });

    let previewUrl: string | null = null;
    if (!(config.smtp.user && config.smtp.pass)) {
      previewUrl = nodemailer.getTestMessageUrl(info) || null;
    }

    return { messageId: info.messageId, previewUrl };
  }

  static async sendReportEmail(userEmail: string, userName: string, pdfBuffer: Buffer) {
    const transporter = await this.getTransporter();

    const info = await transporter.sendMail({
      from: `"Crave Canteen" <${config.smtp.user || testAccount?.user || 'test@cravecanteen.com'}>`,
      to: userEmail,
      subject: 'Your Crave Canteen Financial Report',
      text: 'Please find attached your financial report.',
      attachments: [
        {
          filename: 'Financial_Report.pdf',
          content: pdfBuffer,
        },
      ],
    });

    let previewUrl: string | null = null;
    if (!(config.smtp.user && config.smtp.pass)) {
      previewUrl = nodemailer.getTestMessageUrl(info) || null;
    }

    return { messageId: info.messageId, previewUrl };
  }
}
