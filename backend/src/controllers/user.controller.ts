import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth/auth.service';

export class UserController {
  static async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = await AuthService.getUserProfile(id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({ success: true, user });
    } catch (e) {
      next(e);
    }
  }
}
