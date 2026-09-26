import { Request, Response, NextFunction } from 'express';
import { AiService } from '../services/ai/ai.service';

export class AiController {
  static async generateStatement(req: Request, res: Response, next: NextFunction) {
    try {
      const { userName, stats } = req.body;
      const statement = await AiService.generateSpendingStatement(userName, stats);
      res.json({ success: true, statement });
    } catch (e) {
      next(e);
    }
  }
}
