import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';

const router = Router();

router.post('/statement', AiController.generateStatement);

export default router;
