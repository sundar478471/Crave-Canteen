import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();

router.post('/', OrderController.createOrder);
router.get('/:id/receipt', OrderController.getReceipt);
router.post('/status-update', OrderController.updateStatus);
router.post('/verify-voucher', OrderController.verifyVoucher);

export default router;
