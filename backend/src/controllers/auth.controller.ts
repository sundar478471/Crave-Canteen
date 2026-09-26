import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth/auth.service';

export class AuthController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const uid = req.params.uid as string;
      const user = await AuthService.getUserProfile(uid);
      if (!user) {
        res.status(404).json({ error: 'User profile not found' });
        return;
      }
      res.json({ success: true, user });
    } catch (e) {
      next(e);
    }
  }

  static async createProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.body;
      await AuthService.createUserProfile(user);
      res.json({ success: true, message: 'User profile updated/created' });
    } catch (e) {
      next(e);
    }
  }
}
