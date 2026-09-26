import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

router.get('/profile/:uid', AuthController.getProfile);
router.post('/profile', AuthController.createProfile);

export default router;
