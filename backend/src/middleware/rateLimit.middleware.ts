import { Request, Response, NextFunction } from 'express';

const requestsMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000; 
const MAX_REQUESTS = 100; 

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith('/api')) {
    return next();
  }
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = requestsMap.get(ip);

  if (!record || now > record.resetTime) {
    requestsMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  next();
}
