import { v4 as uuidv4 } from 'uuid';
import { Exam } from '../models/Exam';
import { ExamCategory } from '../models/ExamCategory';
import { Subject } from '../models/Subject';
import { Topic } from '../models/Topic';
import { Question } from '../models/Question';
import { Test } from '../models/Test';
import { AITest } from '../models/AITest';
import { AIQuestionRecord } from '../models/AIQuestionRecord';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';
import {
  generateMCQs,
  isOpenRouterConfigured,
  getDefaultModel,
  NormalizedMCQ,
  TokenUsage,
} from '../lib/ai/openrouter';

const activeGenerations = new Map<string, number>();

export function isGenerationInProgress(userId: string): boolean {
  const started = activeGenerations.get(userId);
  if (!started) return false;
  if (Date.now() - started > 30 * 60 * 1000) {
    activeGenerations.delete(userId);
    return false;
  }
  return true;
}

async function getExistingHashes(examSlug: string): Promise<string[]> {
  const records = await AIQuestionRecord.find({ examSlug }).select('questionHash').lean();
  return records.map((r) => r.questionHash);
}

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

async function getOrCreateTopic(subjectId: string): Promise<string> {
  let topic =
    (await Topic.findOne({ subjectId, slug: 'general' })) ??
    (await Topic.findOne({ subjectId }).sort({ order: 1 }));

  if (!topic) {
    try {
      topic = await Topic.create({ name: 'General', slug: 'general', subjectId });
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
      topic =
        (await Topic.findOne({ subjectId, slug: 'general' })) ??
        (await Topic.findOne({ subjectId }).sort({ order: 1 }));
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

export async function generateAiTest(params: {
  examId: string;
  subjects: string[];
  totalQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  createdBy: string;
  title?: string;
  aiModel?: string;
}) {
  if (!isOpenRouterConfigured()) {
    throw new ApiError(503, 'OPENROUTER_API_KEY is not configured');
  }

  if (isGenerationInProgress(params.createdBy)) {
    throw new ApiError(429, 'A test generation is already in progress. Please wait for it to complete.');
  }

  if (params.totalQuestions < 20 || params.totalQuestions > 200) {
    throw new ApiError(400, 'Question count must be between 20 and 200');
  }

  if (!params.subjects.length) {
    throw new ApiError(400, 'Select at least one subject');
  }

  const exam = await Exam.findById(params.examId);
  if (!exam) throw new ApiError(404, 'Exam not found');

  const category = await ExamCategory.findById(exam.categoryId);
  if (!category) throw new ApiError(404, 'Category not found');

  activeGenerations.set(params.createdBy, Date.now());

  const batchId = `ait-${uuidv4().slice(0, 8)}`;
  const testTitle = params.title ?? `AI Mock Test - ${exam.name}`;
  const model = params.aiModel ?? getDefaultModel();
  const durationMinutes = Math.max(30, Math.ceil(params.totalQuestions * 1.2));

  const batch = await AITest.create({
    batchId,
    examId: exam._id,
    examSlug: exam.slug,
    examCategoryId: category._id,
    categorySlug: category.slug,
    subjectIds: [],
    subjectNames: params.subjects,
    difficulty: params.difficulty,
    requestedQuestions: params.totalQuestions,
    title: testTitle,
    durationMinutes,
    status: 'processing',
    progress: 0,
    aiModel: model,
    createdBy: params.createdBy,
  });

  try {
    const existingHashes = await getExistingHashes(exam.slug);
    const questionsPerSubject = Math.ceil(params.totalQuestions / params.subjects.length);
    const allMcqs: Array<NormalizedMCQ & { subject: string; difficulty: 'easy' | 'medium' | 'hard' }> = [];
    const totalUsage: TokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
    };

    for (let i = 0; i < params.subjects.length; i++) {
      const subjectName = params.subjects[i];
      const count = Math.min(questionsPerSubject, params.totalQuestions - allMcqs.length);
      if (count <= 0) break;

      const diff = resolveDifficulty(params.difficulty, i);
      const result = await generateMCQs({
        count,
        examSlug: exam.slug,
        categorySlug: category.slug,
        subject: subjectName,
        difficulty: params.difficulty === 'mixed' ? diff : params.difficulty,
        excludeHashes: [...existingHashes, ...allMcqs.map((q) => q.questionHash)],
        model,
        onProgress: async (generated, total) => {
          const subjectProgress = ((i + generated / total) / params.subjects.length) * 100;
          await AITest.findByIdAndUpdate(batch._id, { progress: Math.round(subjectProgress) });
        },
      });

      totalUsage.promptTokens += result.usage.promptTokens;
      totalUsage.completionTokens += result.usage.completionTokens;
      totalUsage.totalTokens += result.usage.totalTokens;
      totalUsage.estimatedCostUsd += result.usage.estimatedCostUsd;

      for (const q of result.questions) {
        if (existingHashes.includes(q.questionHash)) continue;
        allMcqs.push({ ...q, subject: subjectName, difficulty: diff });
        existingHashes.push(q.questionHash);
      }
    }

    const deficit = params.totalQuestions - allMcqs.length;
    if (deficit > 0) {
      const lastSubject = params.subjects[params.subjects.length - 1];
      const diff = resolveDifficulty(params.difficulty, params.subjects.length - 1);
      const topup = await generateMCQs({
        count: deficit,
        examSlug: exam.slug,
        categorySlug: category.slug,
        subject: lastSubject,
        difficulty: params.difficulty === 'mixed' ? diff : params.difficulty,
        excludeHashes: [...existingHashes, ...allMcqs.map((q) => q.questionHash)],
        model,
      });

      totalUsage.promptTokens += topup.usage.promptTokens;
      totalUsage.completionTokens += topup.usage.completionTokens;
      totalUsage.totalTokens += topup.usage.totalTokens;
      totalUsage.estimatedCostUsd += topup.usage.estimatedCostUsd;

      for (const q of topup.questions) {
        if (existingHashes.includes(q.questionHash)) continue;
        allMcqs.push({ ...q, subject: lastSubject, difficulty: diff });
        existingHashes.push(q.questionHash);
      }
    }

    const finalMcqs = allMcqs.slice(0, params.totalQuestions);
    if (!finalMcqs.length) {
      throw new ApiError(422, 'No unique questions could be generated. Try different subjects or exam.');
    }

    const savedMcqs: Array<NormalizedMCQ & { subject: string; difficulty: 'easy' | 'medium' | 'hard' }> = [];
    const aiRecords: (typeof AIQuestionRecord.prototype)[] = [];

    for (const mcq of finalMcqs) {
      try {
        const doc = await AIQuestionRecord.create({
          exam: exam.name,
          examSlug: exam.slug,
          subject: mcq.subject,
          difficulty: mcq.difficulty,
          question: mcq.question,
          questionHi: mcq.questionHi,
          options: mcq.options,
          correctAnswer: mcq.correctAnswer,
          explanation: mcq.explanation,
          explanationHi: mcq.explanationHi,
          questionHash: mcq.questionHash,
          aiModel: model,
          generatedBy: params.createdBy,
          batchId,
          generatedAt: new Date(),
        });
        aiRecords.push(doc);
        savedMcqs.push(mcq);
      } catch (err) {
        const mongoErr = err as { code?: number };
        if (mongoErr.code !== 11000) throw err;
      }
    }

    if (!savedMcqs.length) {
      throw new ApiError(422, 'All generated questions were duplicates. Try different subjects or difficulty.');
    }

    const subjectMap = new Map<string, string>();
    for (const subj of params.subjects) {
      const s = await ensureSubject(category._id.toString(), subj);
      subjectMap.set(subj, s._id);
    }

    const topicIdBySubject = new Map<string, string>();
    for (const subjectId of new Set(subjectMap.values())) {
      topicIdBySubject.set(subjectId, await getOrCreateTopic(subjectId));
    }

    const questionPayloads = savedMcqs.map((mcq) => {
      const subjectId = subjectMap.get(mcq.subject)!;
      return {
        type: 'single_mcq' as const,
        text: mcq.question,
        textHi: mcq.questionHi,
        options: mcq.options,
        correctAnswer: mcq.correctAnswer,
        explanation: mcq.explanation,
        explanationHi: mcq.explanationHi,
        subjectId,
        topicId: topicIdBySubject.get(subjectId)!,
        examCategoryId: category._id,
        difficulty: mcq.difficulty,
        tags: ['ai-generated', 'ai-test'],
        createdBy: params.createdBy,
      };
    });

    const questionDocs = await Question.insertMany(questionPayloads);
    const questionIds = questionDocs.map((q) => q._id);

    await AIQuestionRecord.updateMany(
      { batchId },
      { $set: { testId: null } }
    );

    const sections = params.subjects.map((subjName) => {
      const subjectId = subjectMap.get(subjName)!;
      return {
        name: subjName,
        subjectId,
        questionIds: questionDocs
          .filter((q) => q.subjectId.toString() === subjectId)
          .map((q) => q._id),
        marksPerQuestion: 1,
        negativeMarks: 0.25,
      };
    });

    const uniqueSlug = `${slugify(testTitle)}-${Date.now().toString(36)}`;
    const test = await Test.create({
      title: testTitle,
      slug: uniqueSlug,
      description: `AI-generated mock test for ${exam.name}`,
      type: 'full_length',
      examId: exam._id,
      examSlug: exam.slug,
      examSlugs: [exam.slug],
      examCategoryId: category._id,
      categorySlug: category.slug,
      questionIds,
      sections,
      subjects: params.subjects,
      totalQuestions: questionIds.length,
      totalMarks: questionIds.length,
      durationMinutes,
      status: 'draft',
      isLive: false,
      source: 'AI',
      aiBatchId: batchId,
      instructions: 'This is an AI-generated mock test. Review and publish when ready.',
      createdBy: params.createdBy,
    });

    await AIQuestionRecord.updateMany({ batchId }, { $set: { testId: test._id } });

    const subjectIds = [...subjectMap.values()];
    batch.generatedQuestions = questionIds.length;
    batch.questionIds = questionIds;
    batch.testId = test._id;
    batch.subjectIds = subjectIds as unknown as typeof batch.subjectIds;
    batch.tokenUsage = totalUsage;
    batch.progress = 100;
    batch.status = 'completed';
    await batch.save();

    return {
      batch,
      test,
      questions: savedMcqs.map((q, i) => ({
        question: q.question,
        options: q.options.map((o) => o.text),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        subject: q.subject,
        difficulty: q.difficulty,
        _id: aiRecords[i]?._id,
      })),
      tokenUsage: totalUsage,
      previewCount: savedMcqs.length,
    };
  } catch (err) {
    batch.status = 'failed';
    batch.error = err instanceof Error ? err.message : 'Test generation failed';
    await batch.save();
    throw err;
  } finally {
    activeGenerations.delete(params.createdBy);
  }
}

export async function publishAiTest(params: { testId: string; batchId?: string; userId: string }) {
  const test = await Test.findById(params.testId);
  if (!test) throw new ApiError(404, 'Test not found');
  if (test.source !== 'AI') throw new ApiError(400, 'Only AI-generated tests can be published via this endpoint');
  if (test.status === 'published') throw new ApiError(400, 'Test is already published');

  const now = new Date();
  test.status = 'published';
  test.isLive = true;
  test.publishedAt = now;
  await test.save();

  if (params.batchId || test.aiBatchId) {
    await AITest.findOneAndUpdate(
      { batchId: params.batchId ?? test.aiBatchId },
      { $set: { status: 'completed' } }
    );
  }

  return test;
}

export async function listAiTests(params: { examId?: string; page?: number; limit?: number }) {
  const filter: Record<string, unknown> = {};
  if (params.examId) filter.examId = params.examId;

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const [batches, total] = await Promise.all([
    AITest.find(filter)
      .populate('examId', 'name slug')
      .populate('testId', 'title slug status totalQuestions source subjects')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AITest.countDocuments(filter),
  ]);

  return { batches, total, page, limit };
}

export async function getAiTestPreview(batchId: string) {
  const batch = await AITest.findOne({ batchId })
    .populate('examId', 'name slug')
    .populate('testId', 'title slug status totalQuestions')
    .lean();
  if (!batch) throw new ApiError(404, 'Batch not found');

  const questions = await AIQuestionRecord.find({ batchId })
    .select('question options correctAnswer explanation subject difficulty')
    .limit(50)
    .lean();

  return { batch, questions };
}

export async function listStudentTests(params: {
  userId: string;
  role: string;
  exam?: string;
  page?: number;
  limit?: number;
}) {
  const { getExamFilterContext, buildExamContentFilter } = await import('./exam-filter.service');
  const ctx = await getExamFilterContext(params.userId, params.role);
  const filter = buildExamContentFilter(ctx, { status: 'published' });

  if (params.exam?.trim()) {
    filter.examSlug = params.exam.trim();
  }

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const [tests, total] = await Promise.all([
    Test.find(filter)
      .select('title slug examSlug examSlugs subjects totalQuestions durationMinutes source status publishedAt type')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Test.countDocuments(filter),
  ]);

  return { tests, total, page, limit, selectedExams: ctx.examSlugs };
}
