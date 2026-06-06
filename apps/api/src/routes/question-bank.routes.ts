import { Router } from 'express';
import * as aiQuestionController from '../controllers/ai-question.controller';
import { authenticate, requireInstructor } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, requireInstructor, aiQuestionController.getQuestionBank);
router.get('/analytics', authenticate, requireInstructor, aiQuestionController.getQuestionBankAnalytics);

export default router;
