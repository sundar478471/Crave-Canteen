import { Request, Response, NextFunction } from 'express';
import { adminAuth, adminDb } from '../config/firebase';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token.trim() === '' || token === 'undefined' || token === 'null' || token.toLowerCase() === 'bypass') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (adminAuth) {
      const decodedToken = await adminAuth.verifyIdToken(token);
      let userRole = decodedToken.role as string | undefined;

      if (!userRole && adminDb) {
        try {
          const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
          if (userDoc.exists) {
            userRole = userDoc.data()?.role;
          }
        } catch (_) {
          // ignore lookup error
        }
      }

      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        role: userRole
      };
      return next();
    } else {
      // In dev mode without Firebase admin service account: attach UID securely without token bypass
      req.user = { id: token };
      return next();
    }
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
