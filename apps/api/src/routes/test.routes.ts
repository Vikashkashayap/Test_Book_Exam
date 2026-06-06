import { Router } from 'express';
import * as testController from '../controllers/test.controller';
import { authenticate, requireStudent } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, requireStudent, testController.listTests);
router.get('/results/me', authenticate, requireStudent, testController.getMyResults);
router.get('/results/:id', authenticate, requireStudent, testController.getResult);
router.get('/:id', authenticate, requireStudent, testController.getTest);
router.post('/:id/start', authenticate, requireStudent, testController.startAttempt);
router.get('/attempts/:attemptId/questions', authenticate, requireStudent, testController.getAttemptQuestions);
router.patch('/attempts/:attemptId/answer', authenticate, requireStudent, testController.saveAnswer);
router.post('/attempts/:attemptId/submit', authenticate, requireStudent, testController.submitAttempt);

export default router;
