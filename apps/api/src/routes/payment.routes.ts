import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate, requireStudent } from '../middleware/auth';

const router = Router();
router.post('/create-order', authenticate, requireStudent, paymentController.createPaymentOrder);
router.post('/verify', authenticate, requireStudent, paymentController.verifyPayment);
router.post('/webhook', paymentController.webhook);

export default router;
