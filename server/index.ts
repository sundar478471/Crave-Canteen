import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { db } from './firebase.ts';
import { doc, getDoc } from 'firebase/firestore';

dotenv.config();

const RECEIPTS_DIR = path.join(process.cwd(), 'receipts');
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR);
}

const receiptCache = new Map<string, Buffer>();

export async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  let testAccount: nodemailer.TestAccount | null = null;
  let cachedTransporter: nodemailer.Transporter | null = null;

  async function getTransporter() {
    if (cachedTransporter) return cachedTransporter;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const host = (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.host.com') ? process.env.SMTP_HOST : 'smtp.gmail.com';
      const transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_PORT ? process.env.SMTP_PORT === '465' : true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      
      try {
        await transporter.verify();
        cachedTransporter = transporter;
        return transporter;
      } catch (error: any) {
        console.error('SMTP Verification Error:', error.message);
        if (error.message && error.message.includes('535-5.7.8')) {
          console.warn('⚠️ WARNING: Invalid SMTP credentials. If using Gmail, you MUST use an App Password instead of your regular Google password. Falling back to Ethereal test account.');
        } else {
          console.warn('⚠️ WARNING: Failed to connect to SMTP server. Falling back to Ethereal test account.');
        }
      }
    }

    if (!testAccount) {
      testAccount = await nodemailer.createTestAccount();
    }
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return cachedTransporter;
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV });
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const { order, user } = req.body;

      const docPdf = new PDFDocument();
      const buffers: Buffer[] = [];
      docPdf.on('data', buffers.push.bind(buffers));
      
      docPdf.fontSize(25).text('Crave Canteen - Order Receipt', { align: 'center' });
      docPdf.moveDown();
      docPdf.fontSize(14).text(`Order ID: ${order.id}`);
      docPdf.text(`Date: ${new Date(order.timestamp).toLocaleString()}`);
      docPdf.text(`Customer: ${user.name}`);
      docPdf.text(`Email: ${user.email}`);
      docPdf.moveDown();
      
      docPdf.fontSize(18).text('Items Ordered:');
      order.items.forEach((item: any) => {
        docPdf.fontSize(12).text(`${item.name} x${item.quantity} - Rs. ${item.price * item.quantity}`);
      });
      
      docPdf.moveDown();
      docPdf.fontSize(16).font('Helvetica-Bold').text(`Total Amount: Rs. ${order.total}`);
      docPdf.font('Helvetica').text(`Payment Method: ${order.paymentMethod}`);
      
      const pdfBufferPromise = new Promise<Buffer>((resolve) => {
        docPdf.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
      });

      docPdf.end();
      const pdfBuffer = await pdfBufferPromise;

      receiptCache.set(order.id, pdfBuffer);
      fs.writeFileSync(path.join(RECEIPTS_DIR, `${order.id}.pdf`), pdfBuffer);
      setTimeout(() => receiptCache.delete(order.id), 24 * 60 * 60 * 1000);

      const transporter = await getTransporter();
      let emailPreviewUrl = null;

      if (transporter) {
        const shortOrderId = order.id.includes('-') ? order.id.split('-')[1] : order.id;
        const info = await transporter.sendMail({
          from: `"Crave Canteen" <${process.env.SMTP_USER || testAccount?.user || 'test@cravecanteen.com'}>`,
          to: user.email,
          subject: `Order Receipt - #${shortOrderId}`,
          text: `Hello ${user.name}, your receipt for order #${shortOrderId} is attached.`,
          attachments: [
            {
              filename: `Receipt_${shortOrderId}.pdf`,
              content: pdfBuffer,
            },
          ],
        });
        console.log('Email sent: %s', info.messageId);
        
        if (!(process.env.SMTP_USER && process.env.SMTP_PASS)) {
          emailPreviewUrl = nodemailer.getTestMessageUrl(info);
          console.log('Preview URL: %s', emailPreviewUrl);
        }
      }

      const itemsSummary = order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ');
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const receiptLink = `${appUrl}/api/orders/${order.id}/receipt`;
      
      const shortOrderId = order.id.includes('-') ? order.id.split('-')[1] : order.id;
      const message = `Order #${shortOrderId} Placed! ${itemsSummary}. Total: Rs. ${order.total}. Time: ${new Date(order.timestamp).toLocaleTimeString()}. Click for PDF receipt: ${receiptLink}`;

      console.log(`[Order Notification] To: ${user.phoneNumber}, Message: ${message}`);
      res.json({ success: true, message, emailPreviewUrl, isMockWhatsApp: true, whatsappError: null });
    } catch (error: any) {
      console.error('Order API Error:', error);
      let errorMessage = error.message;
      if (errorMessage && errorMessage.includes('535-5.7.8')) {
        errorMessage = 'Invalid SMTP credentials. If using Gmail, you MUST use an App Password instead of your regular Google password. Go to Google Account -> Security -> 2-Step Verification -> App Passwords to generate one.';
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  app.get('/api/orders/:id/receipt', async (req, res) => {
    try {
      const orderId = req.params.id;
      let pdfBuffer = receiptCache.get(orderId);
      
      if (!pdfBuffer) {
        const filePath = path.join(RECEIPTS_DIR, `${orderId}.pdf`);
        if (fs.existsSync(filePath)) {
          pdfBuffer = fs.readFileSync(filePath);
          receiptCache.set(orderId, pdfBuffer);
        }
      }
      
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

            const docPdf = new PDFDocument();
            const buffers: Buffer[] = [];
            docPdf.on('data', buffers.push.bind(buffers));
            
            docPdf.fontSize(25).text('Crave Canteen - Order Receipt', { align: 'center' });
            docPdf.moveDown();
            const shortOrderId = orderId.includes('-') ? orderId.split('-')[1] : orderId;
            docPdf.fontSize(14).text(`Order ID: #${shortOrderId}`);
            docPdf.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}`);
            docPdf.text(`Customer: ${user.name || 'N/A'}`);
            docPdf.text(`Email: ${user.email || 'N/A'}`);
            docPdf.moveDown();
            
            docPdf.fontSize(18).text('Items Ordered:');
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((item: any) => {
                docPdf.fontSize(12).text(`${item.name} x${item.quantity} - Rs. ${item.price * item.quantity}`);
              });
            }
            
            docPdf.moveDown();
            docPdf.fontSize(16).font('Helvetica-Bold').text(`Total Amount: Rs. ${order.totalAmount || order.total || 0}`);
            docPdf.font('Helvetica').text(`Payment Method: ${order.paymentMethod || 'N/A'}`);
            
            const pdfBufferPromise = new Promise<Buffer>((resolve) => {
              docPdf.on('end', () => resolve(Buffer.concat(buffers)));
            });

            docPdf.end();
            pdfBuffer = await pdfBufferPromise;
            
            receiptCache.set(orderId, pdfBuffer);
            fs.writeFileSync(path.join(RECEIPTS_DIR, `${orderId}.pdf`), pdfBuffer);
            setTimeout(() => receiptCache.delete(orderId), 24 * 60 * 60 * 1000);
          }
        } catch (e) {
          console.error('Fallback Firestore fetch failed:', e);
        }
      }

      if (!pdfBuffer) {
        return res.status(404).send(`
          <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h1>Receipt Not Found or Expired</h1>
              <p>Receipts are only available for 24 hours after ordering.</p>
              <p>If you just placed an order, please try again in a few seconds.</p>
            </body>
          </html>
        `);
      }
      
      const shortOrderId = orderId.includes('-') ? orderId.split('-')[1] : orderId;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=Receipt_${shortOrderId}.pdf`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Receipt Error:', error);
      res.status(500).send(`<h1>Failed to process receipt</h1><pre>${error.message}\n${error.stack}</pre>`);
    }
  });

  app.post('/api/send-whatsapp', async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      console.log(`[System Notification] To: ${phoneNumber}, Message: ${message}`);
      return res.json({ success: true, message: 'Notification logged successfully.' });
    } catch (error: any) {
      console.error('Notification Error:', error);
      res.status(500).json({ error: error.message || 'Failed to send notification' });
    }
  });

  app.post('/api/send-email', async (req, res) => {
    try {
      const { email, name, stats } = req.body;

      const docPdf = new PDFDocument();
      const buffers: Buffer[] = [];
      docPdf.on('data', buffers.push.bind(buffers));
      
      docPdf.fontSize(25).text('Crave Canteen Financial Report', { align: 'center' });
      docPdf.moveDown();
      docPdf.fontSize(16).text(`User: ${name}`);
      docPdf.text(`Email: ${email}`);
      docPdf.moveDown();
      docPdf.fontSize(20).text('Spending Summary');
      docPdf.fontSize(14).text(`Monthly Spending: Rs. ${stats.monthly.toFixed(2)}`);
      docPdf.text(`Yearly Spending: Rs. ${stats.yearly.toFixed(2)}`);
      docPdf.moveDown();
      docPdf.text('Top Items:');
      stats.topItems.forEach((item: any) => {
        docPdf.text(`- ${item.name} (${item.count} orders)`);
      });
      
      const pdfBufferPromise = new Promise<Buffer>((resolve) => {
        docPdf.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
      });

      docPdf.end();
      const pdfBuffer = await pdfBufferPromise;

      const transporter = await getTransporter();
      let previewUrl = '';

      if (transporter) {
        const info = await transporter.sendMail({
          from: `"Crave Canteen" <${process.env.SMTP_USER || testAccount?.user || 'test@cravecanteen.com'}>`,
          to: email,
          subject: 'Your Crave Canteen Financial Report',
          text: 'Please find attached your financial report.',
          attachments: [
            {
              filename: 'Financial_Report.pdf',
              content: pdfBuffer,
            },
          ],
        });
        console.log('Email sent: %s', info.messageId);
        
        if (!(process.env.SMTP_USER && process.env.SMTP_PASS)) {
          previewUrl = nodemailer.getTestMessageUrl(info) || '';
          console.log('Preview URL: %s', previewUrl);
        }
      }

      res.json({ success: true, message: 'Email sent successfully.', previewUrl });
    } catch (error: any) {
      console.error('Email Error:', error);
      let errorMessage = error.message || 'Failed to send Email';
      if (errorMessage && errorMessage.includes('535-5.7.8')) {
        errorMessage = 'Invalid SMTP credentials. If using Gmail, you MUST use an App Password instead of your regular Google password. Go to Google Account -> Security -> 2-Step Verification -> App Passwords to generate one.';
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post('/api/order-status-update', async (req, res) => {
    try {
      const { order, newStatus, user } = req.body;

      if (!user || !user.email) {
        return res.status(400).json({ error: 'User email is required' });
      }

      const transporter = await getTransporter();
      let emailPreviewUrl = null;

      if (transporter) {
        const shortOrderId = order.id.includes('-') ? order.id.split('-')[1] : order.id;
        const info = await transporter.sendMail({
          from: `"Crave Canteen" <${process.env.SMTP_USER || testAccount?.user || 'test@cravecanteen.com'}>`,
          to: user.email,
          subject: `Order Update - #${shortOrderId} is now ${newStatus}`,
          text: `Hello ${user.name},\n\nYour order #${shortOrderId} status has been updated to: ${newStatus}.\n\nThank you for choosing Crave Canteen!`,
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
              <h2 style="color: #9333ea;">Crave Canteen Order Update</h2>
              <p>Hello <strong>${user.name}</strong>,</p>
              <p>Your order <strong>#${shortOrderId}</strong> status has been updated to: <strong style="color: #10b981;">${newStatus}</strong>.</p>
              <p>Thank you for choosing Crave Canteen!</p>
            </div>
          `
        });
        console.log('Status Update Email sent: %s', info.messageId);
        
        if (!(process.env.SMTP_USER && process.env.SMTP_PASS)) {
          emailPreviewUrl = nodemailer.getTestMessageUrl(info);
          console.log('Preview URL: %s', emailPreviewUrl);
        }
      }

      if (user.phoneNumber) {
        const shortOrderId = order.id.includes('-') ? order.id.split('-')[1] : order.id;
        const statusMessage = `Crave Canteen: Your order #${shortOrderId} is now ${newStatus}.`;
        console.log(`[Status Update Notification] To: ${user.phoneNumber}, Message: ${statusMessage}`);
      }

      res.json({ success: true, emailPreviewUrl, isMockWhatsApp: true, whatsappError: null });
    } catch (error: any) {
      console.error('Order Status Update API Error:', error);
      let errorMessage = error.message;
      if (errorMessage && errorMessage.includes('535-5.7.8')) {
        errorMessage = 'Invalid SMTP credentials. If using Gmail, you MUST use an App Password instead of your regular Google password. Go to Google Account -> Security -> 2-Step Verification -> App Passwords to generate one.';
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--prod') || process.argv.includes('--production');
  const distPath = path.join(process.cwd(), 'dist');
  const distExists = fs.existsSync(distPath);

  if (isProduction && distExists) {
    console.log('🚀 Crave Canteen running in PRODUCTION mode (Serving dist static assets)');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('⚡ Crave Canteen running in DEVELOPMENT mode (Vite HMR)');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
