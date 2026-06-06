import { Exam } from '../models/Exam';
import { ExamCategory } from '../models/ExamCategory';
import { Subject } from '../models/Subject';
import { Topic } from '../models/Topic';
import { Question } from '../models/Question';
import { Test } from '../models/Test';
import { QuestionBankEntry, IQuestionBankEntry } from '../models/QuestionBankEntry';
import { AIGenerationLog } from '../models/AIGenerationLog';
import { ScheduledMockJob } from '../models/ScheduledMockJob';
import { Attempt } from '../models/Attempt';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';
import { ensureBankQuestions } from './ai-question.service';
import { TokenUsage } from '../lib/ai/openrouter';
import {
  buildTestPattern,
  normalizeMockType,
  SUBJECT_ALIASES,
  toGenerationDifficulty,
} from '../lib/exams/testBuilder';
import type { MockType, SectionBuildConfig } from '../lib/exams/types';

function isDuplicateKeyError(err: unknown): boolean {
  return (err as { code?: number })?.code === 11000;
}

async function ensureSubject(
  categoryId: string,
  subjectName: string
): Promise<{ _id: string; name: string }> {
  const slug = subjectName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  let subject = await Subject.findOne({ examCategoryId: categoryId, slug });
  if (!subject) {
    try {
      subject = await Subject.create({
        name: subjectName,
        slug,
        examCategoryId: categoryId,
        isActive: true,
      });
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
      subject = await Subject.findOne({ examCategoryId: categoryId, slug });
      if (!subject) throw err;
    }
  }
  return { _id: subject._id.toString(), name: subject.name };
}

async function getOrCreateTopic(subjectId: string, topicName: string): Promise<string> {
  const slug = topicName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || 'general';
  let topic = await Topic.findOne({ subjectId, slug });
  if (!topic) {
    try {
      topic = await Topic.create({ name: topicName, slug, subjectId });
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
      topic = await Topic.findOne({ subjectId, slug });
      if (!topic) throw err;
    }
  }
  return topic._id.toString();
}

function resolveDifficulty(
  base: 'easy' | 'medium' | 'hard' | 'mixed',
  index: number
): 'easy' | 'medium' | 'hard' {
  if (base !== 'mixed') return base;
  return (['easy', 'medium', 'hard'] as const)[index % 3];
}

function subjectMatchVariants(subject: string): string[] {
  const aliases = SUBJECT_ALIASES[subject] ?? [subject];
  return [...new Set([subject, ...aliases])];
}

type SampledBankQuestion = IQuestionBankEntry & {
  sectionSubject: string;
  marksPerQuestion: number;
  negativeMarks: number;
};

async function sampleQuestionsBySections(params: {
  examSlug: string;
  sections: SectionBuildConfig[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  avoidReuse?: boolean;
}): Promise<SampledBankQuestion[]> {
  const selected: SampledBankQuestion[] = [];

  for (let i = 0; i < params.sections.length; i++) {
    const section = params.sections[i];
    const count = section.questionCount;
    if (count <= 0) continue;

    const diff = resolveDifficulty(params.difficulty, i);
    const variants = subjectMatchVariants(section.subject);
    const match: Record<string, unknown> = {
      examSlug: params.examSlug,
      subject: { $in: variants },
    };

    if (params.difficulty !== 'mixed') {
      match.difficulty = params.difficulty;
    } else {
      match.difficulty = diff;
    }

    if (params.avoidReuse) {
      match.lastUsedInTest = { $exists: false };
    }

    const excludeIds = selected.map((q) => q._id);
    if (excludeIds.length) {
      match._id = { $nin: excludeIds };
    }

    const sampled = await QuestionBankEntry.aggregate([
      { $match: match },
      { $sample: { size: count } },
    ]);

    if (sampled.length < count) {
      const fallbackMatch: Record<string, unknown> = {
        examSlug: params.examSlug,
        subject: { $in: variants },
        _id: { $nin: [...excludeIds, ...sampled.map((s: { _id: unknown }) => s._id)] },
      };
      if (params.difficulty !== 'mixed') {
        fallbackMatch.difficulty = params.difficulty;
      }
      const remaining = count - sampled.length;
      const fallback = await QuestionBankEntry.aggregate([
        { $match: fallbackMatch },
        { $sample: { size: remaining } },
      ]);
      sampled.push(...fallback);
    }

    for (const q of sampled) {
      selected.push({
        ...q,
        sectionSubject: section.subject,
        marksPerQuestion: section.marksPerQuestion,
        negativeMarks: section.negativeMarks,
      });
    }
  }

  return selected;
}

function mapMockType(type?: MockType) {
  const mode = normalizeMockType(type);
  if (mode === 'practice_set') return 'practice_set' as const;
  if (mode === 'subject_test') return 'subject_wise' as const;
  return 'full_length' as const;
}

export async function scheduleOrCreateMock(params: {
  examId: string;
  subjects?: string[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount?: number;
  durationMinutes?: number;
  title?: string;
  createdBy: string;
  mockType?: MockType;
  avoidReuse?: boolean;
  autoGenerate?: boolean;
  scheduledAt?: string;
}) {
  const exam = await Exam.findById(params.examId);
  if (!exam) throw new ApiError(404, 'Exam not found');

  const category = await ExamCategory.findById(exam.categoryId);
  if (!category) throw new ApiError(404, 'Category not found');

  const pattern = buildTestPattern({
    examSlug: exam.slug,
    categorySlug: category.slug,
    examName: exam.name,
    mockType: params.mockType,
    selectedSubjects: params.subjects,
  });

  const resolvedSubjects = pattern.subjects;
  const resolvedDifficulty =
    params.difficulty ?? toGenerationDifficulty(pattern.difficulty);
  const resolvedQuestionCount = params.questionCount ?? pattern.totalQuestions;
  const resolvedDuration = params.durationMinutes ?? pattern.durationMinutes;

  const scheduleAt = params.scheduledAt ? new Date(params.scheduledAt) : null;
  const isFutureSchedule = scheduleAt && scheduleAt.getTime() > Date.now();

  if (isFutureSchedule) {
    const job = await ScheduledMockJob.create({
      title: params.title,
      examId: exam._id,
      examSlug: exam.slug,
      subjects: resolvedSubjects,
      difficulty: resolvedDifficulty,
      questionCount: resolvedQuestionCount,
      durationMinutes: resolvedDuration,
      mockType: params.mockType ?? 'full_length',
      avoidReuse: params.avoidReuse ?? true,
      autoGenerate: params.autoGenerate !== false,
      scheduledAt: scheduleAt,
      status: 'pending',
      createdBy: params.createdBy,
    });

    return {
      scheduled: true as const,
      job,
      test: null,
      questions: [],
      questionsAutoGenerated: 0,
    };
  }

  const result = await createTestFromQuestionBank(params);
  return { job: null, ...result, scheduled: false as const };
}

export async function createTestFromQuestionBank(params: {
  examId: string;
  subjects?: string[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount?: number;
  durationMinutes?: number;
  title?: string;
  createdBy: string;
  mockType?: MockType;
  avoidReuse?: boolean;
  autoGenerate?: boolean;
  scheduledAt?: string;
}) {
  const exam = await Exam.findById(params.examId);
  if (!exam) throw new ApiError(404, 'Exam not found');

  const category = await ExamCategory.findById(exam.categoryId);
  if (!category) throw new ApiError(404, 'Category not found');

  const pattern = buildTestPattern({
    examSlug: exam.slug,
    categorySlug: category.slug,
    examName: exam.name,
    mockType: params.mockType,
    selectedSubjects: params.subjects,
  });

  const resolvedSubjects = pattern.subjects;
  const resolvedDifficulty =
    params.difficulty ?? toGenerationDifficulty(pattern.difficulty);
  const resolvedQuestionCount = params.questionCount ?? pattern.totalQuestions;
  const resolvedDuration = params.durationMinutes ?? pattern.durationMinutes;

  let autoGenUsage: TokenUsage | null = null;
  let questionsAutoGenerated = 0;

  if (params.autoGenerate !== false) {
    const fill = await ensureBankQuestions({
      examId: params.examId,
      subjects: resolvedSubjects,
      difficulty: resolvedDifficulty,
      questionCount: resolvedQuestionCount,
      createdBy: params.createdBy,
      avoidReuse: params.avoidReuse,
    });
    autoGenUsage = fill.tokenUsage;
    questionsAutoGenerated = fill.generated;
  }

  const bankQuestions = await sampleQuestionsBySections({
    examSlug: exam.slug,
    sections: pattern.sectionDistribution,
    difficulty: resolvedDifficulty,
    avoidReuse: params.avoidReuse,
  });

  if (bankQuestions.length < Math.min(resolvedQuestionCount, 5)) {
    throw new ApiError(
      400,
      `Could only find ${bankQuestions.length} questions. Try different subjects or enable auto-generate.`
    );
  }

  const subjectMap = new Map<string, string>();
  for (const subj of resolvedSubjects) {
    const s = await ensureSubject(category._id.toString(), subj);
    subjectMap.set(subj, s._id);
  }

  const topicCache = new Map<string, string>();

  const questionPayloads = await Promise.all(
    bankQuestions.map(async (bq) => {
      const sectionSubject = bq.sectionSubject ?? bq.subject;
      const sectionSubjectId =
        subjectMap.get(sectionSubject) ??
        (await ensureSubject(category._id.toString(), sectionSubject))._id;
      const topicKey = `${sectionSubjectId}:${bq.topic}`;
      if (!topicCache.has(topicKey)) {
        topicCache.set(topicKey, await getOrCreateTopic(sectionSubjectId, bq.topic));
      }

      const optionIds = ['A', 'B', 'C', 'D'];
      const options = (bq.options ?? []).map((text: string, i: number) => ({
        id: optionIds[i] ?? String(i + 1),
        text,
        textHi: bq.optionsHi?.[i],
      }));

      return {
        type: 'single_mcq' as const,
        text: bq.question,
        textHi: bq.questionHi,
        options,
        correctAnswer: bq.correctAnswer,
        explanation: bq.explanation,
        explanationHi: bq.explanationHi,
        subjectId: sectionSubjectId,
        topicId: topicCache.get(topicKey)!,
        examCategoryId: category._id,
        difficulty: bq.difficulty,
        marks: bq.marksPerQuestion,
        negativeMarks: bq.negativeMarks,
        tags: ['question-bank', 'mock-test', pattern.mockType],
        createdBy: params.createdBy,
      };
    })
  );

  const questionDocs = await Question.insertMany(questionPayloads);
  const questionIds = questionDocs.map((q) => q._id);
  const bankIds = bankQuestions.map((bq) => bq._id);

  const sections = pattern.sectionDistribution.map((sec) => {
    const subjectId = subjectMap.get(sec.subject)!;
    const sectionQuestionIds = questionDocs
      .filter((q) => q.subjectId.toString() === subjectId)
      .map((q) => q._id);
    return {
      name: sec.subject,
      subjectId,
      questionIds: sectionQuestionIds,
      marksPerQuestion: sec.marksPerQuestion,
      negativeMarks: sec.negativeMarks,
    };
  });

  const totalMarks = questionDocs.reduce((sum, q) => sum + (q.marks ?? 1), 0);
  const mockTypeLabel =
    pattern.mockType === 'full_length'
      ? 'Full Length Mock'
      : pattern.mockType === 'subject_test'
        ? 'Subject Test'
        : 'Practice Set';

  const testTitle =
    params.title ?? `${exam.name} ${mockTypeLabel} — ${new Date().toLocaleDateString('en-IN')}`;
  const uniqueSlug = `${slugify(testTitle)}-${Date.now().toString(36)}`;
  const now = new Date();

  const test = await Test.create({
    title: testTitle,
    slug: uniqueSlug,
    description: `${mockTypeLabel} for ${exam.name} following official exam pattern`,
    type: mapMockType(params.mockType),
    examId: exam._id,
    examSlug: exam.slug,
    examSlugs: [exam.slug],
    examCategoryId: category._id,
    categorySlug: category.slug,
    questionIds,
    sections,
    subjects: resolvedSubjects,
    totalQuestions: questionIds.length,
    totalMarks,
    durationMinutes: resolvedDuration,
    negativeMarking: pattern.negativeMarking,
    status: 'published',
    isLive: true,
    publishedAt: now,
    source: 'question_bank',
    instructions: pattern.instructions,
    createdBy: params.createdBy,
  });

  await QuestionBankEntry.updateMany(
    { _id: { $in: bankIds } },
    { $set: { lastUsedInTest: test._id, lastUsedAt: now } }
  );

  await AIGenerationLog.create({
    type: 'test_build',
    examSlug: exam.slug,
    questionsGenerated: questionsAutoGenerated,
    questionsSaved: questionIds.length,
    duplicatesRemoved: 0,
    tokenUsage: autoGenUsage ?? {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
    },
    createdBy: params.createdBy,
  });

  return {
    test,
    questions: bankQuestions.map((bq, i) => ({
      _id: questionDocs[i]?._id,
      question: bq.question,
      options: bq.options,
      correctAnswer: bq.correctAnswer,
      explanation: bq.explanation,
      subject: bq.subject,
      topic: bq.topic,
      difficulty: bq.difficulty,
    })),
    source: 'question_bank' as const,
    questionsAutoGenerated,
    scheduled: false,
  };
}

let processingJobs = false;

export async function processDueScheduledMocks(): Promise<number> {
  if (processingJobs) return 0;
  processingJobs = true;

  try {
    const now = new Date();
    const dueJobs = await ScheduledMockJob.find({
      status: 'pending',
      scheduledAt: { $lte: now },
    })
      .sort({ scheduledAt: 1 })
      .limit(5);

    let processed = 0;

    for (const job of dueJobs) {
      job.status = 'processing';
      await job.save();

      try {
        const result = await createTestFromQuestionBank({
          examId: job.examId.toString(),
          subjects: job.subjects,
          difficulty: job.difficulty,
          questionCount: job.questionCount,
          durationMinutes: job.durationMinutes,
          title: job.title,
          createdBy: job.createdBy.toString(),
          mockType: job.mockType,
          avoidReuse: job.avoidReuse,
          autoGenerate: job.autoGenerate,
        });

        job.status = 'completed';
        job.testId = result.test._id;
        job.processedAt = new Date();
        await job.save();
        processed++;
      } catch (err) {
        job.status = 'failed';
        job.error = err instanceof Error ? err.message : 'Generation failed';
        job.processedAt = new Date();
        await job.save();
      }
    }

    return processed;
  } finally {
    processingJobs = false;
  }
}

export async function listAdminMocks(params: {
  examId?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await processDueScheduledMocks();

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const testFilter: Record<string, unknown> = {
    source: { $in: ['question_bank', 'AI'] },
    status: { $in: ['published', 'scheduled'] },
  };

  if (params.examId) testFilter.examId = params.examId;
  if (params.difficulty) testFilter['subjects'] = { $exists: true };

  if (params.search?.trim()) {
    testFilter.title = { $regex: params.search.trim(), $options: 'i' };
  }

  const jobFilter: Record<string, unknown> = { status: 'pending' };
  if (params.examId) jobFilter.examId = params.examId;

  const [tests, pendingJobs, testTotal] = await Promise.all([
    Test.find(testFilter)
      .populate('examId', 'name slug')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean(),
    ScheduledMockJob.find(jobFilter)
      .populate('examId', 'name slug')
      .sort({ scheduledAt: 1 })
      .lean(),
    Test.countDocuments(testFilter),
  ]);

  const testIds = tests.map((t) => t._id);
  const attemptAgg = await Attempt.aggregate([
    {
      $match: {
        testId: { $in: testIds },
        status: { $in: ['submitted', 'auto_submitted'] },
      },
    },
    { $group: { _id: '$testId', count: { $sum: 1 } } },
  ]);
  const attemptMap = new Map(attemptAgg.map((a) => [a._id.toString(), a.count]));

  const liveMocks = tests.map((t) => ({
    id: t._id.toString(),
    type: 'test' as const,
    title: t.title,
    examSlug: t.examSlug,
    examName: (t.examId as { name?: string } | null)?.name ?? t.examSlug,
    subjects: t.subjects ?? [],
    totalQuestions: t.totalQuestions,
    durationMinutes: t.durationMinutes,
    status: t.status,
    isLive: t.isLive,
    attemptCount: attemptMap.get(t._id.toString()) ?? t.attemptCount ?? 0,
    scheduledAt: t.scheduledAt,
    publishedAt: t.publishedAt,
    createdAt: t.createdAt,
    source: t.source,
  }));

  const scheduledMocks = pendingJobs.map((j) => ({
    id: j._id.toString(),
    type: 'job' as const,
    title: j.title ?? `${(j.examId as { name?: string } | null)?.name ?? j.examSlug} Mock Test`,
    examSlug: j.examSlug,
    examName: (j.examId as { name?: string } | null)?.name ?? j.examSlug,
    subjects: j.subjects,
    totalQuestions: j.questionCount,
    durationMinutes: j.durationMinutes,
    status: 'scheduled' as const,
    isLive: false,
    attemptCount: 0,
    scheduledAt: j.scheduledAt,
    publishedAt: null,
    createdAt: j.createdAt,
    source: 'scheduler',
  }));

  const combined = [...scheduledMocks, ...liveMocks].sort((a, b) => {
    const aTime = new Date(a.scheduledAt ?? a.publishedAt ?? a.createdAt).getTime();
    const bTime = new Date(b.scheduledAt ?? b.publishedAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });

  return { mocks: combined, total: testTotal + pendingJobs.length, page, limit };
}

export async function deleteAdminMock(params: { id: string; type: 'test' | 'job' }) {
  if (params.type === 'job') {
    const job = await ScheduledMockJob.findById(params.id);
    if (!job) throw new ApiError(404, 'Scheduled mock not found');
    if (job.status !== 'pending') {
      throw new ApiError(400, 'Only pending scheduled mocks can be cancelled');
    }
    job.status = 'cancelled';
    await job.save();
    return { cancelled: true };
  }

  const test = await Test.findById(params.id);
  if (!test) throw new ApiError(404, 'Test not found');
  test.status = 'archived';
  test.isLive = false;
  await test.save();
  return { archived: true };
}

export async function getBankAvailability(params: {
  examId: string;
  subjects?: string[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  avoidReuse?: boolean;
}) {
  const exam = await Exam.findById(params.examId);
  if (!exam) throw new ApiError(404, 'Exam not found');

  const match: Record<string, unknown> = { examSlug: exam.slug };
  if (params.subjects?.length) match.subject = { $in: params.subjects };
  if (params.difficulty && params.difficulty !== 'mixed') {
    match.difficulty = params.difficulty;
  }
  if (params.avoidReuse) {
    match.lastUsedInTest = { $exists: false };
  }

  const breakdown = await QuestionBankEntry.aggregate([
    { $match: match },
    {
      $group: {
        _id: { subject: '$subject', difficulty: '$difficulty' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const total = breakdown.reduce((sum, b) => sum + b.count, 0);

  return { examSlug: exam.slug, examName: exam.name, total, breakdown };
}
