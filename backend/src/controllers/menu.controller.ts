import { Request, Response, NextFunction } from 'express';
import { MENU_ITEMS } from '../../../shared/constants';

export class MenuController {
  static async getMenuItems(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, menu: MENU_ITEMS });
    } catch (e) {
      next(e);
    }
  }
}
