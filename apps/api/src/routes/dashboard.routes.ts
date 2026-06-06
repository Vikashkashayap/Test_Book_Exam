import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate, requireStudent } from '../middleware/auth';

const router = Router();
router.get('/student', authenticate, requireStudent, dashboardController.getStudentDashboard);

export default router;
