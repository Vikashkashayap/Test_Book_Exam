import { Response } from 'express';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/auth';
import { ExamCategory } from '../models/ExamCategory';
import { Exam } from '../models/Exam';
import { Test } from '../models/Test';
import { StudyMaterial } from '../models/StudyMaterial';
import { CurrentAffair } from '../models/CurrentAffair';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';
import { getOfficialExamSlugs } from '../services/exam-official.service';

async function resolveExam(examId: string) {
  const exam = await Exam.findById(examId).populate('categoryId', 'name slug');
  if (!exam) throw new ApiError(404, 'Exam not found');
  return exam;
}

export const listCategories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const categories = await ExamCategory.find().sort({ order: 1 }).lean();
  const examCounts = await Exam.aggregate([
    { $group: { _id: '$categoryId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(examCounts.map((c) => [c._id.toString(), c.count]));

  res.json({
    success: true,
    data: categories.map((c) => ({
      ...c,
      examCount: countMap.get(c._id.toString()) ?? 0,
    })),
  });
});

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, slug, description, icon, group, order } = req.body;
  if (!name || !slug) throw new ApiError(400, 'Name and slug required');

  const category = await ExamCategory.create({
    name,
    slug: slug.toLowerCase(),
    description,
    icon,
    group: group ?? slug.toLowerCase(),
    order: order ?? 0,
  });
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await ExamCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: category });
});

export const listExamsAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { categorySlug, page = 1, limit = 200 } = req.query;
  const filter: Record<string, unknown> = {
    isActive: true,
    slug: { $in: [...getOfficialExamSlugs()] },
  };
  if (categorySlug) filter.categorySlug = categorySlug;

  const skip = (Number(page) - 1) * Number(limit);
  const [exams, total] = await Promise.all([
    Exam.find(filter)
      .populate('categoryId', 'name slug')
      .sort({ order: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Exam.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: exams,
    meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  });
});

export const createExam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, slug, categoryId, description, order } = req.body;
  if (!name) throw new ApiError(400, 'Exam name is required');

  let category;
  if (categoryId) {
    category = await ExamCategory.findById(categoryId);
    if (!category) throw new ApiError(404, 'Category not found');
  } else {
    category = await ExamCategory.findOne({ slug: 'general' });
    if (!category) {
      category = await ExamCategory.create({
        name: 'General',
        slug: 'general',
        group: 'general',
        order: 0,
      });
    }
  }

  const exam = await Exam.create({
    name,
    slug: (slug ?? name).toLowerCase().replace(/\s+/g, '-'),
    categoryId: category._id,
    categorySlug: category.slug,
    description,
    order: order ?? 0,
  });

  const populated = await Exam.findById(exam._id).populate('categoryId', 'name slug').lean();
  res.status(201).json({ success: true, data: populated ?? exam });
});

export const uploadPdfFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file) throw new ApiError(400, 'PDF file is required');

  const url = `${env.API_URL}/uploads/${file.filename}`;
  res.status(201).json({
    success: true,
    data: { url, filename: file.originalname, size: file.size },
  });
});

export const updateExam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!exam) throw new ApiError(404, 'Exam not found');
  res.json({ success: true, data: exam });
});

export const getExamContentStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const exam = await Exam.findOne({ slug: req.params.examSlug });
  if (!exam) throw new ApiError(404, 'Exam not found');

  const [tests, materials, affairs] = await Promise.all([
    Test.countDocuments({ examSlug: exam.slug }),
    StudyMaterial.countDocuments({ examSlug: exam.slug }),
    CurrentAffair.countDocuments({ examSlug: exam.slug }),
  ]);

  res.json({
    success: true,
    data: { exam: exam.slug, tests, materials, affairs },
  });
});

export const createExamTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    title,
    examId,
    type,
    totalQuestions,
    totalMarks,
    durationMinutes,
    questionIds,
    status,
    year,
    instructions,
  } = req.body;

  const exam = await resolveExam(examId);
  const category = await ExamCategory.findById(exam.categoryId);
  if (!category) throw new ApiError(404, 'Category not found');

  const test = await Test.create({
    title,
    slug: slugify(title),
    type: type ?? 'full_length',
    examId: exam._id,
    examSlug: exam.slug,
    examSlugs: [exam.slug],
    examCategoryId: category._id,
    categorySlug: category.slug,
    questionIds: questionIds ?? [],
    totalQuestions: totalQuestions ?? questionIds?.length ?? 0,
    totalMarks: totalMarks ?? totalQuestions ?? 0,
    durationMinutes: durationMinutes ?? 60,
    status: status ?? 'draft',
    publishedAt: status === 'published' ? new Date() : undefined,
    year,
    instructions,
    createdBy: req.user!.id,
  });

  res.status(201).json({ success: true, data: test });
});

export const listExamTestsAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examSlug, status, page = 1, limit = 20 } = req.query;
  const filter: Record<string, unknown> = {};
  if (examSlug) filter.examSlug = examSlug;
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [tests, total] = await Promise.all([
    Test.find(filter)
      .populate('examId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Test.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: tests,
    meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  });
});

export const publishExamTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const test = await Test.findByIdAndUpdate(
    req.params.id,
    { status: 'published', publishedAt: new Date() },
    { new: true }
  );
  if (!test) throw new ApiError(404, 'Test not found');
  res.json({ success: true, data: test });
});

export const uploadStudyMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, examId, type, fileUrl, description, year, requiredPlan } = req.body;
  const exam = await resolveExam(examId);
  const category = await ExamCategory.findById(exam.categoryId);

  const material = await StudyMaterial.create({
    title,
    slug: slugify(title),
    type: type ?? 'pdf_notes',
    fileUrl,
    description,
    year,
    requiredPlan: requiredPlan ?? 'free',
    examId: exam._id,
    examSlug: exam.slug,
    examSlugs: [exam.slug],
    examCategoryId: category!._id,
    categorySlug: category!.slug,
    createdBy: req.user!.id,
  });

  res.status(201).json({ success: true, data: material });
});

export const listStudyMaterialsAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examSlug, type } = req.query;
  const filter: Record<string, unknown> = {};
  if (examSlug) filter.examSlug = examSlug;
  if (type) filter.type = type;

  const materials = await StudyMaterial.find(filter)
    .populate('examId', 'name slug')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: materials });
});

export const uploadCurrentAffair = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    title,
    examId,
    content,
    summary,
    category,
    period,
    imageUrl,
    source,
    publishedDate,
  } = req.body;

  const exam = await resolveExam(examId);
  const categoryDoc = await ExamCategory.findById(exam.categoryId);

  const affair = await CurrentAffair.create({
    title,
    slug: slugify(title),
    content,
    summary,
    category: category ?? 'General',
    period: period ?? 'daily',
    imageUrl,
    source,
    publishedDate: publishedDate ? new Date(publishedDate) : new Date(),
    examId: exam._id,
    examSlug: exam.slug,
    examSlugs: [exam.slug],
    examCategoryIds: [categoryDoc!._id],
    createdBy: req.user!.id,
  });

  res.status(201).json({ success: true, data: affair });
});

export const listCurrentAffairsAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examSlug } = req.query;
  const filter: Record<string, unknown> = {};
  if (examSlug) filter.examSlug = examSlug;

  const affairs = await CurrentAffair.find(filter)
    .populate('examId', 'name slug')
    .sort({ publishedDate: -1 })
    .lean();

  res.json({ success: true, data: affairs });
});
