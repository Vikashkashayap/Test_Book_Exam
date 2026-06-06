import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { isOpenRouterConfigured, getDefaultModel } from '../lib/ai/openrouter';
import { getExamProfile, getExamPatternProfile } from '../lib/exams/examProfiles';
import { formatNegativeMarkingLabel } from '../lib/exams/scoring';
import { Exam } from '../models/Exam';
import {
  generateAndSaveQuestions,
  listQuestionBank,
  getQuestionBankStats,
} from '../services/ai-question.service';
import {
  generateAiQuestionsSchema,
  listQuestionBankSchema,
} from '../validators/ai-question.validator';

export const getAiQuestionStatus = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      configured: isOpenRouterConfigured(),
      model: getDefaultModel(),
      provider: 'openrouter',
      maxPerRequest: [10, 20, 30],
    },
  });
});

export const getExamProfileInfo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examId } = req.query;
  if (!examId || typeof examId !== 'string') {
    throw new ApiError(400, 'examId is required');
  }

  const exam = await Exam.findById(examId).populate('categoryId', 'slug name');
  if (!exam) throw new ApiError(404, 'Exam not found');

  const categorySlug =
    (exam.categoryId as { slug?: string } | null)?.slug ?? exam.categorySlug;
  const profile = getExamProfile(exam.slug, categorySlug);
  const patternProfile = getExamPatternProfile(exam.slug, categorySlug, exam.name);

  res.json({
    success: true,
    data: {
      examSlug: exam.slug,
      examName: exam.name,
      profile: {
        pattern: profile.pattern,
        difficulty: profile.difficulty,
        subjects: profile.subjects,
        totalQuestions: patternProfile.totalQuestions,
        totalMarks: patternProfile.totalMarks,
        durationMinutes: patternProfile.durationMinutes,
        negativeMarkingLabel: formatNegativeMarkingLabel(
          patternProfile.negativeMarking,
          patternProfile.totalMarks / patternProfile.totalQuestions
        ),
        sections: patternProfile.sections,
        questionStyles: patternProfile.questionStyles ?? [],
      },
    },
  });
});

export const generateQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!isOpenRouterConfigured()) {
    throw new ApiError(503, 'OPENROUTER_API_KEY is not configured');
  }

  const parsed = generateAiQuestionsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }

  const result = await generateAndSaveQuestions({
    ...parsed.data,
    createdBy: req.user!.id,
  });

  res.status(201).json({
    success: true,
    data: {
      questions: result.questions,
      analytics: result.analytics,
      exam: result.exam,
    },
  });
});

export const getQuestionBank = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = listQuestionBankSchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }

  const result = await listQuestionBank(parsed.data);

  res.json({
    success: true,
    data: result.entries,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
      stats: result.stats,
    },
  });
});

export const getQuestionBankAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examSlug } = req.query;
  const stats = await getQuestionBankStats(
    typeof examSlug === 'string' ? examSlug : undefined
  );

  res.json({ success: true, data: stats });
});
