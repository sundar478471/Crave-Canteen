import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Global Error Handler:', err);
  let errorMessage = err.message || 'Internal Server Error';
  if (errorMessage && errorMessage.includes('535-5.7.8')) {
    errorMessage = 'Invalid SMTP credentials. If using Gmail, you MUST use an App Password instead of your regular Google password.';
  }
  res.status(err.status || 500).json({ error: errorMessage });
}
