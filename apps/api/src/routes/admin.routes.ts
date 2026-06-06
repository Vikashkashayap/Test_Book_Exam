import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import * as topOfferController from '../controllers/top-offer.controller';
import * as pricingController from '../controllers/pricing.controller';
import { authenticate, requireAdmin, requireInstructor } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', requireAdmin, adminController.getAdminDashboard);
router.get('/top-offer', requireAdmin, topOfferController.getAdminTopOffer);
router.put('/top-offer', requireAdmin, topOfferController.upsertTopOffer);
router.get('/pricing', requireAdmin, pricingController.getAdminPricing);
router.put('/pricing', requireAdmin, pricingController.upsertPricing);
router.get('/questions', requireInstructor, adminController.listQuestions);
router.post('/questions', requireInstructor, adminController.createQuestion);
router.post('/questions/bulk', requireInstructor, adminController.bulkUploadQuestions);
router.post('/tests', requireInstructor, adminController.createTest);
router.patch('/tests/:id', requireInstructor, adminController.updateTest);
router.post('/tests/:id/clone', requireInstructor, adminController.cloneTest);
router.get('/students', requireAdmin, adminController.listStudents);
router.get('/students/:id', requireAdmin, adminController.getStudent);
router.post('/students/purge', requireAdmin, adminController.purgeNonAdminUsers);
router.post('/students/:id/ban', requireAdmin, adminController.banStudent);
router.post('/students/:id/reset-password', requireAdmin, adminController.resetStudentPassword);
router.delete('/students/:id', requireAdmin, adminController.deleteStudent);
router.patch('/students/:id/exams', requireAdmin, adminController.assignStudentExams);
router.get('/students/:id/history', requireAdmin, adminController.getStudentTestHistory);
router.post('/categories', requireAdmin, adminController.createCategory);
router.post('/subjects', requireAdmin, adminController.createSubject);
router.post('/topics', requireAdmin, adminController.createTopic);
router.post('/study-materials', requireInstructor, adminController.createStudyMaterial);
router.post('/current-affairs', requireInstructor, adminController.createCurrentAffair);

export default router;
