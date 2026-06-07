import { Router } from 'express';
import authRoutes from './auth.routes';
import testRoutes from './test.routes';
import dashboardRoutes from './dashboard.routes';
import paymentRoutes from './payment.routes';
import aiRoutes from './ai.routes';
import adminRoutes from './admin.routes';
import leaderboardRoutes from './leaderboard.routes';
import bookmarkRoutes from './bookmark.routes';
import contentRoutes from './content.routes';
import examRoutes from './exam.routes';
import onboardingRoutes from './onboarding.routes';
import examManagementRoutes from './exam-management.routes';
import aiGeneratorRoutes from './ai-generator.routes';
import aiTestRoutes, { studentAiTestRoutes } from './ai-test.routes';
import questionBankRoutes from './question-bank.routes';
import testBuilderRoutes from './test-builder.routes';
import feedbackRoutes, { adminFeedbackRouter } from './feedback.routes';
import publicRoutes from './public.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/exams', examRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/tests', testRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/payments', paymentRoutes);
router.use('/ai', aiRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/exam-management', examManagementRoutes);
router.use('/admin/ai-generator', aiGeneratorRoutes);
router.use('/admin/ai-tests', aiTestRoutes);
router.use('/admin/question-bank', questionBankRoutes);
router.use('/admin/tests', testBuilderRoutes);
router.use('/student', studentAiTestRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/content', contentRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/admin/feedback', adminFeedbackRouter);
router.use('/public', publicRoutes);

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'MentorsDaily ExamPrep Pro API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

export default router;
