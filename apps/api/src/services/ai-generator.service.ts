import { v4 as uuidv4 } from 'uuid';
import { Exam } from '../models/Exam';
import { ExamCategory } from '../models/ExamCategory';
import { Subject } from '../models/Subject';
import { Topic } from '../models/Topic';
import { Question } from '../models/Question';
import { QuestionBank } from '../models/QuestionBank';
import { Test } from '../models/Test';
import { AIGeneratedQuestion } from '../models/AIGeneratedQuestion';
import { AITest } from '../models/AITest';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';
import { generateMCQs, extractMCQsFromPdf, GeneratedMCQ } from './gemini.service';

async function resolveTaxonomy(params: {
  categoryId?: string;
  examId: string;
  subjectId: string;
  topicId: string;
}) {
  const [exam, subject, topic] = await Promise.all([
    Exam.findById(params.examId),
    Subject.findById(params.subjectId),
    Topic.findById(params.topicId),
  ]);

  if (!exam) throw new ApiError(404, 'Exam not found');
  if (!subject) throw new ApiError(404, 'Subject not found');
  if (!topic) throw new ApiError(404, 'Topic not found');

  const category = params.categoryId
    ? await ExamCategory.findById(params.categoryId)
    : await ExamCategory.findById(exam.categoryId);
  if (!category) throw new ApiError(404, 'Category not found');

  return { category, exam, subject, topic };
}

async function saveMcqsToBank(params: {
  mcqs: GeneratedMCQ[];
  examCategoryId: string;
  subjectId: string;
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdBy: string;
  bankName: string;
  bankDescription?: string;
}) {
  const questionDocs = await Question.insertMany(
    params.mcqs.map((mcq) => ({
      type: 'single_mcq' as const,
      text: mcq.question,
      textHi: mcq.questionHi,
      options: mcq.options,
      correctAnswer: mcq.correctAnswer,
      explanation: mcq.explanation,
      explanationHi: mcq.explanationHi,
      subjectId: params.subjectId,
      topicId: params.topicId,
      examCategoryId: params.examCategoryId,
      difficulty: params.difficulty,
      tags: ['ai-generated'],
      createdBy: params.createdBy,
    }))
  );

  const questionIds = questionDocs.map((q) => q._id);

  let bank = await QuestionBank.findOne({
    examCategoryId: params.examCategoryId,
    subjectId: params.subjectId,
    name: params.bankName,
  });

  if (bank) {
    bank.questionIds.push(...questionIds);
    bank.totalQuestions = bank.questionIds.length;
    await bank.save();
  } else {
    bank = await QuestionBank.create({
      name: params.bankName,
      description: params.bankDescription,
      examCategoryId: params.examCategoryId,
      subjectId: params.subjectId,
      questionIds,
      totalQuestions: questionIds.length,
      createdBy: params.createdBy,
    });
  }

  await Question.updateMany({ _id: { $in: questionIds } }, { questionBankId: bank._id });

  return { questionIds, questionBankId: bank._id, questions: questionDocs };
}

export async function generateAndSaveQuestions(params: {
  categoryId?: string;
  examId: string;
  subjectId: string;
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  createdBy: string;
}) {
  if (params.count < 1 || params.count > 25) {
    throw new ApiError(400, 'Question count must be between 1 and 25');
  }

  const { category, exam, subject, topic } = await resolveTaxonomy(params);
  const batchId = `aiq-${uuidv4().slice(0, 8)}`;

  const batch = await AIGeneratedQuestion.create({
    batchId,
    categoryId: category._id,
    categorySlug: category.slug,
    examId: exam._id,
    examSlug: exam.slug,
    subjectId: subject._id,
    topicId: topic._id,
    difficulty: params.difficulty,
    requestedCount: params.count,
    status: 'processing',
    source: 'gemini',
    createdBy: params.createdBy,
  });

  try {
    const mcqs = await generateMCQs({
      count: params.count,
      examName: exam.name,
      categoryName: category.name,
      subjectName: subject.name,
      topicName: topic.name,
      difficulty: params.difficulty,
      examSlug: exam.slug,
      categorySlug: category.slug,
    });

    const bankName = `${exam.name} - ${subject.name} - ${topic.name}`;
    const { questionIds, questionBankId, questions } = await saveMcqsToBank({
      mcqs,
      examCategoryId: category._id.toString(),
      subjectId: subject._id.toString(),
      topicId: topic._id.toString(),
      difficulty: params.difficulty,
      createdBy: params.createdBy,
      bankName,
      bankDescription: `AI-generated questions for ${topic.name}`,
    });

    batch.generatedCount = questions.length;
    batch.questionIds = questionIds;
    batch.questionBankId = questionBankId;
    batch.status = 'completed';
    await batch.save();

    return {
      batch,
      questions: questions.map((q) => ({
        _id: q._id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
      })),
    };
  } catch (err) {
    batch.status = 'failed';
    batch.error = err instanceof Error ? err.message : 'Generation failed';
    await batch.save();
    throw err;
  }
}

export async function extractAndSaveFromPdf(params: {
  filePath: string;
  pdfUrl: string;
  pdfFilename: string;
  categoryId?: string;
  examId: string;
  subjectId?: string;
  topicId?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  maxQuestions?: number;
  createdBy: string;
}) {
  const exam = await Exam.findById(params.examId);
  if (!exam) throw new ApiError(404, 'Exam not found');

  const category = params.categoryId
    ? await ExamCategory.findById(params.categoryId)
    : await ExamCategory.findById(exam.categoryId);
  if (!category) throw new ApiError(404, 'Category not found');

  let subject = params.subjectId ? await Subject.findById(params.subjectId) : null;
  let topic = params.topicId ? await Topic.findById(params.topicId) : null;

  if (!subject) {
    subject = await Subject.findOne({ examCategoryId: category._id, slug: 'general' });
    if (!subject) {
      subject = await Subject.create({
        name: 'General',
        slug: 'general',
        examCategoryId: category._id,
      });
    }
  }

  if (!topic) {
    topic = await Topic.findOne({ subjectId: subject._id, slug: 'general' });
    if (!topic) {
      topic = await Topic.create({ name: 'General', slug: 'general', subjectId: subject._id });
    }
  }

  const batchId = `pdf-${uuidv4().slice(0, 8)}`;
  const batch = await AIGeneratedQuestion.create({
    batchId,
    categoryId: category._id,
    categorySlug: category.slug,
    examId: exam._id,
    examSlug: exam.slug,
    subjectId: subject._id,
    topicId: topic._id,
    difficulty: params.difficulty,
    requestedCount: params.maxQuestions ?? 30,
    status: 'processing',
    source: 'pdf_extraction',
    pdfUrl: params.pdfUrl,
    pdfFilename: params.pdfFilename,
    createdBy: params.createdBy,
  });

  try {
    const mcqs = await extractMCQsFromPdf({
      filePath: params.filePath,
      examName: exam.name,
      categoryName: category.name,
      subjectName: subject.name,
      topicName: topic.name,
      maxQuestions: params.maxQuestions ?? 30,
    });

    if (!mcqs.length) throw new ApiError(422, 'No questions could be extracted from the PDF');

    const bankName = `${exam.name} - PDF Import`;
    const { questionIds, questionBankId, questions } = await saveMcqsToBank({
      mcqs,
      examCategoryId: category._id.toString(),
      subjectId: subject._id.toString(),
      topicId: topic._id.toString(),
      difficulty: params.difficulty,
      createdBy: params.createdBy,
      bankName,
      bankDescription: `Extracted from PDF: ${params.pdfFilename}`,
    });

    batch.generatedCount = questions.length;
    batch.questionIds = questionIds;
    batch.questionBankId = questionBankId;
    batch.status = 'completed';
    await batch.save();

    return { batch, questions, extractedCount: questions.length };
  } catch (err) {
    batch.status = 'failed';
    batch.error = err instanceof Error ? err.message : 'PDF extraction failed';
    await batch.save();
    throw err;
  }
}

export async function generateAndSaveTest(params: {
  examId: string;
  subjectIds: string[];
  totalQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  createdBy: string;
  title?: string;
  scheduleAt?: Date;
  endsAt?: Date;
  aiModel?: string;
}) {
  if (params.totalQuestions < 5 || params.totalQuestions > 500) {
    throw new ApiError(400, 'Total questions must be between 5 and 500');
  }

  const exam = await Exam.findById(params.examId).populate('categoryId');
  if (!exam) throw new ApiError(404, 'Exam not found');

  const category = await ExamCategory.findById(exam.categoryId);
  if (!category) throw new ApiError(404, 'Category not found');

  const subjects = await Subject.find({
    _id: { $in: params.subjectIds },
    examCategoryId: category._id,
  });

  if (!subjects.length) throw new ApiError(400, 'Select at least one valid subject');

  const batchId = `ait-${uuidv4().slice(0, 8)}`;
  const testTitle = params.title ?? `AI Mock Test - ${exam.name}`;
  const now = new Date();
  const scheduleAt = params.scheduleAt instanceof Date ? params.scheduleAt : undefined;
  const endsAt = params.endsAt instanceof Date ? params.endsAt : undefined;
  const shouldSchedule =
    scheduleAt && scheduleAt instanceof Date && !Number.isNaN(scheduleAt.getTime()) && scheduleAt > now;
  const testStatus: 'scheduled' | 'published' = shouldSchedule ? 'scheduled' : 'published';

  const batch = await AITest.create({
    batchId,
    examId: exam._id,
    examSlug: exam.slug,
    examCategoryId: category._id,
    categorySlug: category.slug,
    subjectIds: subjects.map((s) => s._id),
    difficulty: params.difficulty,
    requestedQuestions: params.totalQuestions,
    title: testTitle,
    durationMinutes: Math.max(30, Math.ceil(params.totalQuestions * 1.2)),
    status: 'processing',
    aiModel: params.aiModel ?? 'google/gemini-2.5-flash-lite',
    createdBy: params.createdBy,
  });

  try {
    const questionsPerSubject = Math.ceil(params.totalQuestions / subjects.length);
    const allMcqs: GeneratedMCQ[] = [];
    const usedDifficulties: ('easy' | 'medium' | 'hard')[] =
      params.difficulty === 'mixed'
        ? ['easy', 'medium', 'hard']
        : [params.difficulty];

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      const topic =
        (await Topic.findOne({ subjectId: subject._id }).sort({ order: 1 })) ??
        (await Topic.create({ name: 'General', slug: 'general', subjectId: subject._id }));

      const count = Math.min(
        questionsPerSubject,
        params.totalQuestions - allMcqs.length
      );
      if (count <= 0) break;

      const diff = usedDifficulties[i % usedDifficulties.length];
      const mcqs = await generateMCQs({
        count,
        examName: exam.name,
        categoryName: category.name,
        subjectName: subject.name,
        topicName: topic.name,
        difficulty: diff,
        aiModel: params.aiModel,
        examSlug: exam.slug,
        categorySlug: category.slug,
      });
      allMcqs.push(...mcqs);
    }

    const topicCache = new Map<string, typeof Topic.prototype>();
    async function getTopicForSubject(subjectId: string) {
      const cached = topicCache.get(subjectId);
      if (cached) return cached;
      let topic = await Topic.findOne({ subjectId }).sort({ order: 1 });
      if (!topic) {
        topic = await Topic.create({ name: 'General', slug: 'general', subjectId });
      }
      topicCache.set(subjectId, topic);
      return topic;
    }

    const questionPayloads = await Promise.all(
      allMcqs.slice(0, params.totalQuestions).map(async (mcq, idx) => {
        const subject = subjects[idx % subjects.length];
        const topic = await getTopicForSubject(subject._id.toString());
        return {
          type: 'single_mcq' as const,
          text: mcq.question,
          options: mcq.options,
          correctAnswer: mcq.correctAnswer,
          explanation: mcq.explanation,
          subjectId: subject._id,
          topicId: topic._id,
          examCategoryId: category._id,
          difficulty:
            params.difficulty === 'mixed'
              ? (['easy', 'medium', 'hard'][idx % 3] as 'easy' | 'medium' | 'hard')
              : params.difficulty,
          tags: ['ai-generated', 'ai-test'],
          createdBy: params.createdBy,
        };
      })
    );

    const questionDocs = await Question.insertMany(questionPayloads);
    const questionIds = questionDocs.map((q) => q._id);
    const totalMarks = questionIds.length;

    const sections = subjects.map((s) => ({
      name: s.name,
      subjectId: s._id,
      questionIds: questionDocs.filter((q) => q.subjectId.equals(s._id)).map((q) => q._id),
      marksPerQuestion: 1,
      negativeMarks: 0.25,
    }));

    const test = await Test.create({
      title: testTitle,
      slug: slugify(testTitle),
      description: `AI-generated mock test for ${exam.name}`,
      type: 'full_length',
      examId: exam._id,
      examSlug: exam.slug,
      examSlugs: [exam.slug],
      examCategoryId: category._id,
      categorySlug: category.slug,
      questionIds,
      sections,
      subjects: subjects.map((s) => s.name),
      totalQuestions: questionIds.length,
      totalMarks,
      durationMinutes: batch.durationMinutes,
      status: testStatus,
      isLive: testStatus === 'published',
      scheduledAt: shouldSchedule ? scheduleAt : undefined,
      endsAt: shouldSchedule ? endsAt : undefined,
      publishedAt: testStatus === 'published' ? now : undefined,
      source: 'AI',
      aiBatchId: batchId,
      instructions: 'This is an AI-generated mock test. All the best!',
      createdBy: params.createdBy,
    });

    batch.generatedQuestions = questionIds.length;
    batch.questionIds = questionIds;
    batch.testId = test._id;
    batch.status = 'completed';
    await batch.save();

    return { batch, test, questions: questionDocs };
  } catch (err) {
    batch.status = 'failed';
    batch.error = err instanceof Error ? err.message : 'Test generation failed';
    await batch.save();
    throw err;
  }
}
