import { Router } from 'express';
import * as examController from '../controllers/exam.controller';
import { authenticate, requireStudent } from '../middleware/auth';

const router = Router();

router.get('/ecosystem', examController.getExamEcosystem);
router.get('/', examController.listExams);
router.get('/dashboard/personalized', authenticate, requireStudent, examController.getPersonalizedDashboard);
router.patch('/selected', authenticate, requireStudent, examController.updateSelectedExams);

export default router;
