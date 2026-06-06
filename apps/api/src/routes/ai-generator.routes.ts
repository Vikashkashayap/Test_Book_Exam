import { Router } from 'express';
import * as aiGeneratorController from '../controllers/ai-generator.controller';
import { authenticate, requireInstructor } from '../middleware/auth';
import { pdfUpload } from '../middleware/upload';

const router = Router();

router.use(authenticate, requireInstructor);

router.get('/status', aiGeneratorController.getAiGeneratorStatus);
router.get('/subjects', aiGeneratorController.listSubjects);
router.get('/topics', aiGeneratorController.listTopics);
router.post('/subjects', aiGeneratorController.createSubject);
router.post('/topics', aiGeneratorController.createTopic);

router.post('/questions/generate', aiGeneratorController.generateQuestions);
router.get('/questions', aiGeneratorController.listGeneratedQuestions);
router.post('/questions/pdf-extract', pdfUpload.single('file'), aiGeneratorController.extractQuestionsFromPdf);

router.post('/tests/generate', aiGeneratorController.generateTest);
router.get('/tests', aiGeneratorController.listGeneratedTests);

export default router;
