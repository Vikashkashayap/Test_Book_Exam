import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Test } from '../models/Test';
import { Attempt } from '../models/Attempt';
import { Question } from '../models/Question';
import { Result } from '../models/Result';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { calculateAndSaveResult } from '../services/scoring.service';
import {
  getExamFilterContext,
  buildExamContentFilter,
  canAccessExamContent,
} from '../services/exam-filter.service';

const PLAN_ORDER = ['free', 'silver', 'gold', 'premium'];

function canAccessTest(userPlan: string, requiredPlan: string): boolean {
  const userIdx = PLAN_ORDER.indexOf(userPlan);
  const reqIdx = PLAN_ORDER.indexOf(requiredPlan);
  if (userIdx >= 0 && reqIdx >= 0) return userIdx >= reqIdx;
  if (userPlan !== 'free' && reqIdx >= 0) {
    return reqIdx <= PLAN_ORDER.indexOf('premium');
  }
  return false;
}

async function promoteDueScheduledTests(now: Date) {
  // Promote scheduled tests to published when their start time is reached.
  await Test.updateMany(
    {
      status: 'scheduled',
      scheduledAt: { $lte: now },
      $or: [
        { endsAt: { $exists: false } },
        { endsAt: null },
        { endsAt: { $gte: now } },
      ],
    },
    { $set: { status: 'published', publishedAt: now, isLive: true } }
  );
}

export const listTests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, examCategoryId, exam, page = 1, limit = 20, completed } = req.query;
  await promoteDueScheduledTests(new Date());
  const ctx = await getExamFilterContext(req.user!.id, req.user!.role);
  const filter = buildExamContentFilter(ctx, { status: 'published' });
  if (type) filter.type = type;
  if (examCategoryId) filter.examCategoryId = examCategoryId;
  if (typeof exam === 'string' && exam.trim()) filter.examSlug = exam.trim();

  const userResults = await Result.find({ userId: req.user!.id })
    .select('testId score maxScore percentage createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const completedTestIds = [...new Set(userResults.map((r) => r.testId.toString()))];
  const latestResultByTest = new Map(
    userResults.map((r) => [r.testId.toString(), r])
  );

  const showCompleted = completed === 'true' || completed === '1';
  if (showCompleted) {
    if (!completedTestIds.length) {
      return res.json({
        success: true,
        data: [],
        meta: { page: Number(page), limit: Number(limit), total: 0, totalPages: 0 },
      });
    }
    filter._id = { $in: completedTestIds };
  } else if (completedTestIds.length) {
    filter._id = { $nin: completedTestIds };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [tests, total] = await Promise.all([
    Test.find(filter)
      .populate('examCategoryId', 'name slug')
      .populate('subjectId', 'name')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Test.countDocuments(filter),
  ]);

  const data = tests.map((test) => {
    const result = latestResultByTest.get(test._id.toString());
    if (!result) return test;
    return {
      ...test,
      userResult: {
        resultId: result._id,
        score: result.score,
        maxScore: result.maxScore,
        percentage: result.percentage,
        completedAt: result.createdAt,
      },
    };
  });

  res.json({
    success: true,
    data,
    meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  });
});

export const getTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  await promoteDueScheduledTests(new Date());
  const ctx = await getExamFilterContext(req.user!.id, req.user!.role);
  const test = await Test.findById(req.params.id)
    .populate('examCategoryId', 'name')
    .lean();
  if (!test || test.status !== 'published') throw new ApiError(404, 'Test not found');
  if (!canAccessExamContent(ctx, test.examSlug)) throw new ApiError(403, 'Test not in your selected exams');
  res.json({ success: true, data: test });
});

export const startAttempt = asyncHandler(async (req: AuthRequest, res: Response) => {
  await promoteDueScheduledTests(new Date());
  const ctx = await getExamFilterContext(req.user!.id, req.user!.role);
  const test = await Test.findById(req.params.id);
  if (!test || test.status !== 'published') throw new ApiError(404, 'Test not available');
  if (!canAccessExamContent(ctx, test.examSlug)) throw new ApiError(403, 'Test not in your selected exams');

  const { User } = await import('../models/User');
  const user = await User.findById(req.user!.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (!canAccessTest(user.subscriptionPlan, test.requiredPlan)) {
    throw new ApiError(403, 'Upgrade subscription to access this test');
  }

  const existing = await Attempt.findOne({
    userId: req.user!.id,
    testId: test._id,
    status: 'in_progress',
  });
  if (existing) {
    return res.json({
      success: true,
      data: {
        ...existing.toObject(),
        testMeta: {
          title: test.title,
          totalMarks: test.totalMarks,
          totalQuestions: test.totalQuestions,
          durationMinutes: test.durationMinutes,
          negativeMarking: test.negativeMarking,
          hasTimer: test.durationMinutes > 0,
          instructions: test.instructions,
          type: test.type,
        },
      },
    });
  }

  const hasTimer = test.durationMinutes > 0;
  const durationSeconds = hasTimer ? test.durationMinutes * 60 : 0;
  const expiresAt = hasTimer
    ? new Date(Date.now() + durationSeconds * 1000)
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const answers = test.questionIds.map((qId) => ({
    questionId: qId,
    answer: null,
    status: 'not_answered' as const,
    timeSpentSeconds: 0,
  }));

  const attempt = await Attempt.create({
    userId: req.user!.id,
    testId: test._id,
    answers,
    expiresAt,
    timeRemainingSeconds: durationSeconds,
    status: 'in_progress',
  });

  test.attemptCount += 1;
  await test.save();

  res.status(201).json({
    success: true,
    data: {
      ...attempt.toObject(),
      testMeta: {
        title: test.title,
        totalMarks: test.totalMarks,
        totalQuestions: test.totalQuestions,
        durationMinutes: test.durationMinutes,
        negativeMarking: test.negativeMarking,
        hasTimer,
        instructions: test.instructions,
        type: test.type,
      },
    },
  });
});

export const getAttemptQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attempt = await Attempt.findOne({
    _id: req.params.attemptId,
    userId: req.user!.id,
  });
  if (!attempt) throw new ApiError(404, 'Attempt not found');

  const questions = await Question.find({
    _id: { $in: attempt.answers.map((a) => a.questionId) },
  })
    .select('-correctAnswer -explanation')
    .lean();

  const ordered = attempt.answers.map((a) =>
    questions.find((q) => q._id.toString() === a.questionId.toString())
  );

  res.json({
    success: true,
    data: {
      attempt,
      questions: ordered.filter(Boolean),
    },
  });
});

export const saveAnswer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { questionId, answer, status, timeSpentSeconds, currentQuestionIndex } = req.body;

  const attempt = await Attempt.findOne({
    _id: req.params.attemptId,
    userId: req.user!.id,
    status: 'in_progress',
  });
  if (!attempt) throw new ApiError(404, 'Attempt not found');
  if (new Date() > attempt.expiresAt) {
    attempt.status = 'auto_submitted';
    await attempt.save();
    await calculateAndSaveResult(attempt._id.toString());
    throw new ApiError(410, 'Test time expired — auto submitted');
  }

  const idx = attempt.answers.findIndex((a) => a.questionId.toString() === questionId);
  if (idx >= 0) {
    attempt.answers[idx].answer = answer;
    attempt.answers[idx].status = status ?? 'answered';
    attempt.answers[idx].timeSpentSeconds =
      (attempt.answers[idx].timeSpentSeconds ?? 0) + (timeSpentSeconds ?? 0);
    attempt.answers[idx].visitedAt = new Date();
  }

  if (currentQuestionIndex !== undefined) attempt.currentQuestionIndex = currentQuestionIndex;
  if (req.body.timeRemainingSeconds !== undefined) {
    attempt.timeRemainingSeconds = req.body.timeRemainingSeconds;
  }

  await attempt.save();
  res.json({ success: true, data: attempt });
});

export const submitAttempt = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attempt = await Attempt.findOne({
    _id: req.params.attemptId,
    userId: req.user!.id,
    status: 'in_progress',
  });
  if (!attempt) throw new ApiError(404, 'Attempt not found');

  attempt.status = req.body.autoSubmit ? 'auto_submitted' : 'submitted';
  attempt.submittedAt = new Date();
  await attempt.save();

  const result = await calculateAndSaveResult(attempt._id.toString());
  res.json({ success: true, data: result });
});

export const getResult = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await Result.findById(req.params.id)
    .populate('testId', 'title type totalMarks durationMinutes questionIds')
    .lean();
  if (!result) throw new ApiError(404, 'Result not found');
  if (result.userId.toString() !== req.user!.id && !['admin', 'super_admin'].includes(req.user!.role)) {
    throw new ApiError(403, 'Access denied');
  }

  const test = result.testId as {
    title: string;
    questionIds?: { toString(): string }[];
  } | null;

  const attempt = await Attempt.findById(result.attemptId).lean();
  const questionIds = test?.questionIds ?? [];

  const questions = questionIds.length
    ? await Question.find({ _id: { $in: questionIds } })
        .populate('subjectId', 'name')
        .select('text textHi options correctAnswer explanation explanationHi type marks subjectId')
        .lean()
    : [];

  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));
  const answerMap = new Map(
    (attempt?.answers ?? []).map((a) => [a.questionId.toString(), a])
  );

  const questionReview = questionIds.map((qId, index) => {
    const q = questionMap.get(qId.toString());
    const ans = answerMap.get(qId.toString());
    const subject = q?.subjectId as { name?: string } | undefined;

    return {
      index: index + 1,
      questionId: qId.toString(),
      text: q?.text ?? '',
      textHi: q?.textHi,
      options: q?.options ?? [],
      explanationHi: q?.explanationHi,
      type: q?.type ?? 'single_mcq',
      subjectName: subject?.name ?? 'General',
      userAnswer: ans?.answer ?? null,
      correctAnswer: q?.correctAnswer ?? null,
      explanation: q?.explanation ?? '',
      isCorrect: ans?.isCorrect ?? false,
      status: ans?.status ?? 'not_answered',
      marksObtained: ans?.marksObtained ?? 0,
      marks: q?.marks ?? 1,
    };
  });

  res.json({ success: true, data: { ...result, questionReview } });
});

export const getMyResults = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const filter = { userId: req.user!.id };

  const [results, total] = await Promise.all([
    Result.find(filter)
      .populate('testId', 'title type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Result.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: results,
    meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  });
});
