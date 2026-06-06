import { Router } from 'express';
import * as aiQuestionController from '../controllers/ai-question.controller';
import { authenticate, requireInstructor } from '../middleware/auth';
import { aiGenerationLimiter } from '../middleware/ai-rate-limit';

const router = Router();

router.get('/status', authenticate, requireInstructor, aiQuestionController.getAiQuestionStatus);
router.get('/profile', authenticate, requireInstructor, aiQuestionController.getExamProfileInfo);
router.post(
  '/generate',
  authenticate,
  requireInstructor,
  aiGenerationLimiter,
  aiQuestionController.generateQuestions
);

export default router;
