import { Router } from 'express';
import * as leaderboardController from '../controllers/leaderboard.controller';
import { authenticate, requireStudent } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, requireStudent, leaderboardController.getLeaderboard);

export default router;
