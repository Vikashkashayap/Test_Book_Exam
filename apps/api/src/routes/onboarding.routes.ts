import { Router } from 'express';
import * as onboardingController from '../controllers/onboarding.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/step-1', onboardingController.registerStep1);
router.post('/step-2', authenticate, onboardingController.registerStep2);
router.post('/step-3', authenticate, onboardingController.registerStep3);

export default router;
