import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import * as otpController from '../controllers/otp.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
  ],
  authController.register
);

router.post('/login', [body('email').isEmail(), body('password').notEmpty()], authController.login);
router.post('/dev/make-admin', authController.makeAdminDev);
router.post('/otp/send', otpController.requestOtp);
router.post('/otp/verify', otpController.verifyOtpLogin);
router.post('/google', authController.googleLogin);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
