import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { isOpenRouterConfigured, getDefaultModel } from '../lib/ai/openrouter';
import {
  generateAiTest,
  publishAiTest,
  listAiTests,
  getAiTestPreview,
  listStudentTests,
} from '../services/ai-test.service';
import { generateAiTestSchema, publishAiTestSchema } from '../validators/ai-test.validator';
import { Exam } from '../models/Exam';
import { getExamSubjectsFromProfile } from '../lib/ai/examProfiles';

export const getExamSubjectsList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examId } = req.query;
  if (!examId || typeof examId !== 'string') {
    throw new ApiError(400, 'examId is required');
  }
  const exam = await Exam.findById(examId).populate('categoryId', 'slug');
  if (!exam) throw new ApiError(404, 'Exam not found');
  const categorySlug =
    (exam.categoryId as { slug?: string } | null)?.slug ?? exam.categorySlug;
  const subjects = getExamSubjectsFromProfile(exam.slug, categorySlug);
  res.json({ success: true, data: { examSlug: exam.slug, subjects } });
});

export const getAiTestStatus = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      configured: isOpenRouterConfigured(),
      model: getDefaultModel(),
      provider: 'openrouter',
    },
  });
});

export const generateTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!isOpenRouterConfigured()) {
    throw new ApiError(503, 'OPENROUTER_API_KEY is not configured');
  }

  const parsed = generateAiTestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }

  const result = await generateAiTest({
    ...parsed.data,
    createdBy: req.user!.id,
  });

  res.status(201).json({
    success: true,
    data: {
      batch: result.batch,
      test: result.test,
      questions: result.questions,
      tokenUsage: result.tokenUsage,
      previewCount: result.previewCount,
    },
  });
});

export const publishTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = publishAiTestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }

  const test = await publishAiTest({
    testId: parsed.data.testId,
    batchId: parsed.data.batchId,
    userId: req.user!.id,
  });

  res.json({
    success: true,
    data: { test, published: true },
  });
});

export const listTests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examId, page = 1, limit = 20 } = req.query;
  const result = await listAiTests({
    examId: typeof examId === 'string' ? examId : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  res.json({
    success: true,
    data: result.batches,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
});

export const getPreview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { batchId } = req.params;
  const result = await getAiTestPreview(batchId);
  res.json({ success: true, data: result });
});

export const studentTests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { exam, page = 1, limit = 20 } = req.query;
  const result = await listStudentTests({
    userId: req.user!.id,
    role: req.user!.role,
    exam: typeof exam === 'string' ? exam : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  res.json({
    success: true,
    data: result.tests,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
      selectedExams: result.selectedExams,
    },
  });
});
