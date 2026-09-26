import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { config } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimit.middleware';

import authRoutes from './routes/auth.routes';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';
import userRoutes from './routes/user.routes';
import aiRoutes from './routes/ai.routes';
import notificationRoutes from './routes/notification.routes';
import reportRoutes from './routes/report.routes';

export async function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use('/api', rateLimiter);

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: config.nodeEnv, timestamp: Date.now() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reports', reportRoutes);

  // Backward compatibility routes for legacy frontend callers
  app.post('/api/order-status-update', (req, res, next) => {
    req.url = '/status-update';
    orderRoutes(req, res, next);
  });
  app.post('/api/send-whatsapp', (req, res, next) => {
    req.url = '/send-whatsapp';
    notificationRoutes(req, res, next);
  });
  app.post('/api/send-email', (req, res, next) => {
    req.url = '/send-email';
    reportRoutes(req, res, next);
  });

  app.use(errorHandler);

  const distPath = path.join(process.cwd(), 'dist');
  const distExists = fs.existsSync(distPath);

  if (config.isProduction && distExists) {
    console.log('🚀 Crave Canteen backend serving production assets from dist/');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else if (!config.isProduction) {
    console.log('⚡ Crave Canteen backend attaching Vite middleware in DEV mode');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  return app;
}
