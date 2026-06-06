import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { authenticate, requireStudent } from '../middleware/auth';

const router = Router();
router.post('/mentor/chat', authenticate, requireStudent, aiController.mentorChat);
router.get('/mentor/sessions', authenticate, requireStudent, aiController.listChatSessions);
router.get('/mentor/history', authenticate, requireStudent, aiController.getChatHistory);

export default router;
