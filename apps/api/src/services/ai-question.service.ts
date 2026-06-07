import { Exam } from '../models/Exam';
import { ExamCategory } from '../models/ExamCategory';
import { QuestionBankEntry } from '../models/QuestionBankEntry';
import { AIGenerationLog } from '../models/AIGenerationLog';
import { ApiError } from '../utils/ApiError';
import {
  generateMCQs,
  isOpenRouterConfigured,
  getDefaultModel,
  NormalizedMCQ,
  TokenUsage,
} from '../lib/ai/openrouter';
import { getExamProfile } from '../lib/ai/examProfiles';

const activeGenerations = new Map<string, number>();

export function isQuestionGenerationInProgress(userId: string): boolean {
  const started = activeGenerations.get(userId);
  if (!started) return false;
  if (Date.now() - started > 15 * 60 * 1000) {
    activeGenerations.delete(userId);
    return false;
  }
  return true;
}

async function getExistingHashes(examSlug: string): Promise<string[]> {
  const records = await QuestionBankEntry.find({ examSlug }).select('questionHash').lean();
  return records.map((r) => r.questionHash);
}

export interface GenerationAnalytics {
  questionsGenerated: number;
  questionsSaved: number;
  duplicatesRemoved: number;
  tokenUsage: TokenUsage;
  aiModel: string;
}

export async function generateAndSaveQuestions(params: {
  examId: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  createdBy: string;
  aiModel?: string;
  year?: number;
}) {
  if (!isOpenRouterConfigured()) {
    throw new ApiError(503, 'OPENROUTER_API_KEY is not configured');
  }

  if (isQuestionGenerationInProgress(params.createdBy)) {
    throw new ApiError(429, 'A question generation is already in progress. Please wait.');
  }

  const exam = await Exam.findById(params.examId);
  if (!exam) throw new ApiError(404, 'Exam not found');

  const category = await ExamCategory.findById(exam.categoryId);
  if (!category) throw new ApiError(404, 'Category not found');

  const profile = getExamProfile(exam.slug, category.slug);
  if (!profile.subjects.some((s) => s.toLowerCase() === params.subject.toLowerCase())) {
    // Allow custom subjects but warn via profile — don't block
  }

  activeGenerations.set(params.createdBy, Date.now());
  const model = params.aiModel ?? getDefaultModel();

  try {
    const existingHashes = await getExistingHashes(exam.slug);
    const result = await generateMCQs({
      count: params.questionCount,
      examSlug: exam.slug,
      categorySlug: category.slug,
      subject: params.subject,
      topic: params.topic,
      year: params.year,
      difficulty: params.difficulty,
      excludeHashes: existingHashes,
      model,
    });

    const saved: Array<NormalizedMCQ & { _id?: string }> = [];
    let duplicatesRemoved = 0;

    for (const mcq of result.questions) {
      if (existingHashes.includes(mcq.questionHash)) {
        duplicatesRemoved++;
        continue;
      }

      try {
        const doc = await QuestionBankEntry.create({
          exam: exam.name,
          examSlug: exam.slug,
          subject: params.subject,
          topic: params.topic,
          difficulty: params.difficulty,
          question: mcq.question,
          questionHi: mcq.questionHi,
          options: mcq.options.map((o) => o.text),
          optionsHi: mcq.options.map((o) => o.textHi).filter(Boolean) as string[],
          correctAnswer: mcq.correctAnswer,
          explanation: mcq.explanation,
          explanationHi: mcq.explanationHi,
          source: 'ai',
          aiModel: model,
          generatedBy: params.createdBy,
          questionHash: mcq.questionHash,
          generatedAt: new Date(),
        });
        saved.push({ ...mcq, _id: doc._id.toString() });
        existingHashes.push(mcq.questionHash);
      } catch (err) {
        const mongoErr = err as { code?: number };
        if (mongoErr.code === 11000) {
          duplicatesRemoved++;
          continue;
        }
        throw err;
      }
    }

    duplicatesRemoved = result.questions.length - saved.length;

    const analytics: GenerationAnalytics = {
      questionsGenerated: result.questions.length,
      questionsSaved: saved.length,
      duplicatesRemoved,
      tokenUsage: result.usage,
      aiModel: model,
    };

    await AIGenerationLog.create({
      type: 'question_generation',
      examSlug: exam.slug,
      subject: params.subject,
      topic: params.topic,
      questionsGenerated: analytics.questionsGenerated,
      questionsSaved: analytics.questionsSaved,
      duplicatesRemoved: analytics.duplicatesRemoved,
      tokenUsage: analytics.tokenUsage,
      aiModel: model,
      createdBy: params.createdBy,
    });

    if (!saved.length) {
      throw new ApiError(
        422,
        'All generated questions were duplicates. Try a different topic or difficulty.'
      );
    }

    return {
      questions: saved.map((q) => ({
        _id: q._id,
        question: q.question,
        options: q.options.map((o) => o.text),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        subject: params.subject,
        topic: params.topic,
        difficulty: params.difficulty,
      })),
      analytics,
      exam: { name: exam.name, slug: exam.slug },
    };
  } finally {
    activeGenerations.delete(params.createdBy);
  }
}

export async function listQuestionBank(params: {
  examId?: string;
  examSlug?: string;
  subject?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  page?: number;
  limit?: number;
}) {
  const filter: Record<string, unknown> = {};

  if (params.examId) {
    const exam = await Exam.findById(params.examId).select('slug name');
    if (exam) filter.examSlug = exam.slug;
  } else if (params.examSlug) {
    filter.examSlug = params.examSlug;
  }

  if (params.subject) filter.subject = params.subject;
  if (params.topic) filter.topic = params.topic;
  if (params.difficulty) filter.difficulty = params.difficulty;

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    QuestionBankEntry.find(filter)
      .select('-__v')
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    QuestionBankEntry.countDocuments(filter),
  ]);

  const stats = await QuestionBankEntry.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        bySubject: { $push: '$subject' },
      },
    },
  ]);

  return {
    entries,
    total,
    page,
    limit,
    stats: {
      totalInBank: stats[0]?.totalQuestions ?? total,
    },
  };
}

function resolveBankBatchSize(needed: number): number {
  if (needed >= 8) return 8;
  if (needed >= 5) return 5;
  return Math.max(needed, 3);
}

/** Auto-fill bank when scheduling a mock test — generates in batches of 25 (or 20) with top-up */
export async function ensureBankQuestions(params: {
  examId: string;
  subjects: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount: number;
  createdBy: string;
  avoidReuse?: boolean;
  year?: number;
}): Promise<{ generated: number; tokenUsage: TokenUsage }> {
  if (!isOpenRouterConfigured()) {
    throw new ApiError(503, 'OPENROUTER_API_KEY is not configured. Add OPENROUTER_API_KEY to enable auto-generation.');
  }

  const exam = await Exam.findById(params.examId);
  if (!exam) throw new ApiError(404, 'Exam not found');
  const category = await ExamCategory.findById(exam.categoryId);
  if (!category) throw new ApiError(404, 'Category not found');

  const perSubject = Math.ceil(params.questionCount / params.subjects.length);
  let totalGenerated = 0;
  const totalUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
  };

  for (let i = 0; i < params.subjects.length; i++) {
    const subject = params.subjects[i];
    const diff =
      params.difficulty === 'mixed'
        ? (['easy', 'medium', 'hard'] as const)[i % 3]
        : params.difficulty;

    const bankFilter: Record<string, unknown> = {
      examSlug: exam.slug,
      subject,
      difficulty: diff,
    };
    if (params.avoidReuse) {
      bankFilter.lastUsedInTest = { $exists: false };
    }

    let available = await QuestionBankEntry.countDocuments(bankFilter);
    const needed = perSubject - available;
    if (needed <= 0) continue;

    let attempts = 0;
    const maxAttempts = Math.ceil(needed / 3) + 2;

    const topic = params.year ? `PYQ ${params.year}` : 'General';

    const runBatch = async (count: number) => {
      const result = await generateAndSaveQuestions({
        examId: params.examId,
        subject,
        topic,
        difficulty: diff,
        questionCount: count,
        createdBy: params.createdBy,
        year: params.year,
      });
      totalGenerated += result.analytics.questionsSaved;
      totalUsage.promptTokens += result.analytics.tokenUsage.promptTokens;
      totalUsage.completionTokens += result.analytics.tokenUsage.completionTokens;
      totalUsage.totalTokens += result.analytics.tokenUsage.totalTokens;
      totalUsage.estimatedCostUsd += result.analytics.tokenUsage.estimatedCostUsd;
    };

    const safeGenerate = async (count: number, maxRetries = 1) => {
      for (let retry = 0; retry <= maxRetries; retry++) {
        try {
          await runBatch(count);
          return true;
        } catch (err) {
          if (err instanceof ApiError && err.statusCode === 429) {
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          const msg = err instanceof Error ? err.message : '';
          if (
            msg.includes('parse') ||
            msg.includes('JSON') ||
            msg.includes('valid questions') ||
            msg.includes('duplicates')
          ) {
            if (retry < maxRetries) {
              await new Promise((r) => setTimeout(r, 1500));
              continue;
            }
            return false;
          }
          throw err;
        }
      }
      return false;
    };

    while (available < perSubject && attempts < maxAttempts) {
      const deficit = perSubject - available;
      const ok = await safeGenerate(resolveBankBatchSize(deficit));
      available = await QuestionBankEntry.countDocuments(bankFilter);
      attempts++;
      if (!ok) break;
    }
  }

  return { generated: totalGenerated, tokenUsage: totalUsage };
}

export async function getQuestionBankStats(examSlug?: string) {
  const match: Record<string, unknown> = {};
  if (examSlug) match.examSlug = examSlug;

  const [bankStats, logStats] = await Promise.all([
    QuestionBankEntry.aggregate([
      { $match: match },
      {
        $group: {
          _id: { examSlug: '$examSlug', subject: '$subject' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    AIGenerationLog.aggregate([
      { $match: { ...match, type: 'question_generation' } },
      {
        $group: {
          _id: null,
          questionsGenerated: { $sum: '$questionsGenerated' },
          questionsSaved: { $sum: '$questionsSaved' },
          duplicatesRemoved: { $sum: '$duplicatesRemoved' },
          totalTokens: { $sum: '$tokenUsage.totalTokens' },
          estimatedCostUsd: { $sum: '$tokenUsage.estimatedCostUsd' },
        },
      },
    ]),
  ]);

  const analytics = logStats[0] ?? {
    questionsGenerated: 0,
    questionsSaved: 0,
    duplicatesRemoved: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
  };

  return { bankStats, analytics };
}
