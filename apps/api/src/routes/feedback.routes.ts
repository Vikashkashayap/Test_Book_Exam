import { Router } from 'express';
import * as feedbackController from '../controllers/feedback.controller';
import { authenticate, requireStudent, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, requireStudent, feedbackController.submitFeedback);
router.get('/mine', authenticate, requireStudent, feedbackController.listMyFeedback);

export default router;

export const adminFeedbackRouter = Router();
adminFeedbackRouter.use(authenticate, requireAdmin);
adminFeedbackRouter.get('/stats', feedbackController.getFeedbackStats);
adminFeedbackRouter.get('/', feedbackController.listAllFeedback);
adminFeedbackRouter.patch('/:id', feedbackController.updateFeedbackStatus);
