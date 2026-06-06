import { Router } from 'express';
import * as ctrl from '../controllers/exam-management.controller';
import { authenticate, requireAdmin, requireInstructor } from '../middleware/auth';
import { pdfUpload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/categories', requireInstructor, ctrl.listCategories);
router.post('/categories', requireAdmin, ctrl.createCategory);
router.patch('/categories/:id', requireAdmin, ctrl.updateCategory);

router.get('/exams', requireInstructor, ctrl.listExamsAdmin);
router.post('/exams', requireAdmin, ctrl.createExam);
router.patch('/exams/:id', requireAdmin, ctrl.updateExam);
router.get('/exams/:examSlug/stats', requireInstructor, ctrl.getExamContentStats);

router.get('/tests', requireInstructor, ctrl.listExamTestsAdmin);
router.post('/tests', requireInstructor, ctrl.createExamTest);
router.patch('/tests/:id/publish', requireInstructor, ctrl.publishExamTest);

router.post('/upload', requireInstructor, pdfUpload.single('file'), ctrl.uploadPdfFile);

router.get('/materials', requireInstructor, ctrl.listStudyMaterialsAdmin);
router.post('/materials', requireInstructor, ctrl.uploadStudyMaterial);

router.get('/current-affairs', requireInstructor, ctrl.listCurrentAffairsAdmin);
router.post('/current-affairs', requireInstructor, ctrl.uploadCurrentAffair);

export default router;
