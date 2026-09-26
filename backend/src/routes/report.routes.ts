import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';

const router = Router();

router.post('/send-email', ReportController.sendReportEmail);

export default router;
