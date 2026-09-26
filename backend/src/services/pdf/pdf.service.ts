import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const RECEIPTS_DIR = path.join(process.cwd(), 'receipts');
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

const receiptCache = new Map<string, Buffer>();

export class PdfService {
  static async generateOrderReceiptPdf(order: any, user: any): Promise<Buffer> {
    const docPdf = new PDFDocument();
    const buffers: Buffer[] = [];
    docPdf.on('data', buffers.push.bind(buffers));
    
    docPdf.fontSize(25).text('Crave Canteen - Order Receipt', { align: 'center' });
    docPdf.moveDown();
    const shortId = order.id.includes('-') ? order.id.split('-')[1] : order.id;
    docPdf.fontSize(14).text(`Order ID: #${shortId}`);
    docPdf.text(`Date: ${new Date(order.timestamp || order.createdAt || Date.now()).toLocaleString()}`);
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
    const pdfBuffer = await pdfBufferPromise;

    receiptCache.set(order.id, pdfBuffer);
    fs.writeFileSync(path.join(RECEIPTS_DIR, `${order.id}.pdf`), pdfBuffer);
    setTimeout(() => receiptCache.delete(order.id), 24 * 60 * 60 * 1000);

    return pdfBuffer;
  }

  static getCachedReceipt(orderId: string): Buffer | null {
    let pdfBuffer = receiptCache.get(orderId) || null;
    if (!pdfBuffer) {
      const filePath = path.join(RECEIPTS_DIR, `${orderId}.pdf`);
      if (fs.existsSync(filePath)) {
        pdfBuffer = fs.readFileSync(filePath);
        receiptCache.set(orderId, pdfBuffer);
      }
    }
    return pdfBuffer;
  }

  static async generateFinancialReportPdf(name: string, email: string, stats: any): Promise<Buffer> {
    const docPdf = new PDFDocument();
    const buffers: Buffer[] = [];
    docPdf.on('data', buffers.push.bind(buffers));
    
    docPdf.fontSize(25).text('Crave Canteen Financial Report', { align: 'center' });
    docPdf.moveDown();
    docPdf.fontSize(16).text(`User: ${name}`);
    docPdf.text(`Email: ${email}`);
    docPdf.moveDown();
    docPdf.fontSize(20).text('Spending Summary');
    docPdf.fontSize(14).text(`Monthly Spending: Rs. ${stats.monthly ? stats.monthly.toFixed(2) : 0}`);
    docPdf.text(`Yearly Spending: Rs. ${stats.yearly ? stats.yearly.toFixed(2) : 0}`);
    docPdf.moveDown();
    docPdf.text('Top Items:');
    if (stats.topItems && Array.isArray(stats.topItems)) {
      stats.topItems.forEach((item: any) => {
        const itemStr = typeof item === 'string' ? item : `${item.name} (${item.count} orders)`;
        docPdf.text(`- ${itemStr}`);
      });
    }
    
    const pdfBufferPromise = new Promise<Buffer>((resolve) => {
      docPdf.on('end', () => resolve(Buffer.concat(buffers)));
    });

    docPdf.end();
    return await pdfBufferPromise;
  }
}
