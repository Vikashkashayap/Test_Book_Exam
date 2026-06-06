import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Subject } from '../models/Subject';
import { Topic } from '../models/Topic';
import { AIGeneratedQuestion } from '../models/AIGeneratedQuestion';
import { AITest } from '../models/AITest';
import { Exam } from '../models/Exam';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { isGeminiConfigured, getAiModelName } from '../services/gemini.service';
import {
  generateAndSaveQuestions,
  generateAndSaveTest,
  extractAndSaveFromPdf,
} from '../services/ai-generator.service';
import {
  generateQuestionsSchema,
  generateTestSchema,
  pdfExtractSchema,
} from '../validators/ai-generator.validator';

export const getAiGeneratorStatus = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      geminiConfigured: isGeminiConfigured(),
      model: getAiModelName(),
    },
  });
});

export const listSubjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examId, categoryId } = req.query;
  const filter: Record<string, unknown> = { isActive: true };

  if (examId) {
    const exam = await Exam.findById(examId);
    if (!exam) throw new ApiError(404, 'Exam not found');
    filter.examCategoryId = exam.categoryId;
  } else if (categoryId) {
    filter.examCategoryId = categoryId;
  } else {
    throw new ApiError(400, 'examId or categoryId is required');
  }

  const subjects = await Subject.find(filter).sort({ order: 1, name: 1 }).lean();
  res.json({ success: true, data: subjects });
});

export const listTopics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subjectId } = req.query;
  if (!subjectId) throw new ApiError(400, 'subjectId is required');

  const topics = await Topic.find({ subjectId, isActive: true }).sort({ order: 1, name: 1 }).lean();
  res.json({ success: true, data: topics });
});

export const createSubject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, examId, categoryId } = req.body;
  if (!name) throw new ApiError(400, 'Subject name is required');

  let examCategoryId = categoryId;
  if (examId) {
    const exam = await Exam.findById(examId);
    if (!exam) throw new ApiError(404, 'Exam not found');
    examCategoryId = exam.categoryId;
  }
  if (!examCategoryId) throw new ApiError(400, 'examId or categoryId is required');

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const subject = await Subject.create({ name, slug, examCategoryId });
  res.status(201).json({ success: true, data: subject });
});

export const createTopic = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, subjectId } = req.body;
  if (!name || !subjectId) throw new ApiError(400, 'name and subjectId are required');

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const topic = await Topic.create({ name, slug, subjectId });
  res.status(201).json({ success: true, data: topic });
});

export const generateQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!isGeminiConfigured()) throw new ApiError(503, 'OPENROUTER_API_KEY is not configured');

  const parsed = generateQuestionsSchema.safeParse(req.body);
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
      batch: result.batch,
      questions: result.questions,
      savedToQuestionBank: true,
    },
  });
});

export const listGeneratedQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examId, page = 1, limit = 20 } = req.query;
  const filter: Record<string, unknown> = {};
  if (examId) filter.examId = examId;

  const skip = (Number(page) - 1) * Number(limit);
  const [batches, total] = await Promise.all([
    AIGeneratedQuestion.find(filter)
      .populate('examId', 'name slug')
      .populate('subjectId', 'name')
      .populate('topicId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    AIGeneratedQuestion.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: batches,
    meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  });
});

export const generateTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!isGeminiConfigured()) throw new ApiError(503, 'OPENROUTER_API_KEY is not configured');

  const parsed = generateTestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }

  const result = await generateAndSaveTest({
    ...parsed.data,
    createdBy: req.user!.id,
  });

  res.status(201).json({
    success: true,
    data: {
      batch: result.batch,
      test: result.test,
      savedToTestCollection: true,
    },
  });
});

export const listGeneratedTests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examId, page = 1, limit = 20 } = req.query;
  const filter: Record<string, unknown> = {};
  if (examId) filter.examId = examId;

  const skip = (Number(page) - 1) * Number(limit);
  const [batches, total] = await Promise.all([
    AITest.find(filter)
      .populate('examId', 'name slug')
      .populate('testId', 'title slug status totalQuestions')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    AITest.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: batches,
    meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  });
});

export const extractQuestionsFromPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!isGeminiConfigured()) throw new ApiError(503, 'OPENROUTER_API_KEY is not configured');
  if (!req.file) throw new ApiError(400, 'PDF file is required');

  const parsed = pdfExtractSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }

  const pdfUrl = `${env.API_URL}/uploads/${req.file.filename}`;
  const result = await extractAndSaveFromPdf({
    filePath: req.file.path,
    pdfUrl,
    pdfFilename: req.file.originalname,
    ...parsed.data,
    createdBy: req.user!.id,
  });

  res.status(201).json({
    success: true,
    data: {
      batch: result.batch,
      extractedCount: result.extractedCount,
      questions: result.questions.map((q) => ({
        _id: q._id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
      savedToQuestionBank: true,
    },
  });
});
