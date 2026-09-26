import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();

router.post('/send-whatsapp', NotificationController.sendWhatsapp);

export default router;
