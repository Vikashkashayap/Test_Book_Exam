import { Router } from 'express';
import * as aiTestController from '../controllers/ai-test.controller';
import { authenticate, requireInstructor, requireStudent } from '../middleware/auth';
import { aiGenerationLimiter } from '../middleware/ai-rate-limit';

const router = Router();

router.get('/status', authenticate, requireInstructor, aiTestController.getAiTestStatus);
router.get('/subjects', authenticate, requireInstructor, aiTestController.getExamSubjectsList);
router.post(
  '/generate',
  authenticate,
  requireInstructor,
  aiGenerationLimiter,
  aiTestController.generateTest
);
router.post('/publish', authenticate, requireInstructor, aiTestController.publishTest);
router.get('/', authenticate, requireInstructor, aiTestController.listTests);
router.get('/preview/:batchId', authenticate, requireInstructor, aiTestController.getPreview);

const studentRouter = Router();
studentRouter.get('/tests', authenticate, requireStudent, aiTestController.studentTests);

export { studentRouter as studentAiTestRoutes };
export default router;
