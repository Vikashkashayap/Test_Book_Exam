import { Router } from 'express';
import * as testBuilderController from '../controllers/test-builder.controller';
import { authenticate, requireInstructor } from '../middleware/auth';

const router = Router();

router.get('/pattern', authenticate, requireInstructor, testBuilderController.getExamPattern);
router.get('/subjects', authenticate, requireInstructor, testBuilderController.getTestBuilderSubjects);
router.get('/availability', authenticate, requireInstructor, testBuilderController.getBankAvailabilityInfo);
router.get('/mocks', authenticate, requireInstructor, testBuilderController.listMocks);
router.post('/create', authenticate, requireInstructor, testBuilderController.createTest);
router.delete('/mocks/:id', authenticate, requireInstructor, testBuilderController.removeMock);

export default router;
