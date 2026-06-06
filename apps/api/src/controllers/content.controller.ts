import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StudyMaterial } from '../models/StudyMaterial';
import { CurrentAffair } from '../models/CurrentAffair';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import {
  getExamFilterContext,
  buildExamContentFilter,
  buildCurrentAffairsFilter,
  canAccessExamContent,
} from '../services/exam-filter.service';

export const listStudyMaterials = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, examCategoryId, exam, examSlug, page = 1, limit = 12 } = req.query;
  const ctx = await getExamFilterContext(req.user!.id, req.user!.role);
  const filter = buildExamContentFilter(ctx, { isActive: true });
  if (type) filter.type = type;
  if (examCategoryId) filter.examCategoryId = examCategoryId;
  const examSlugValue = typeof exam === 'string' ? exam : typeof examSlug === 'string' ? examSlug : undefined;
  if (examSlugValue) {
    filter.$and = [
      ...(Array.isArray(filter.$and) ? (filter.$and as unknown[]) : []),
      { $or: [{ examSlug: examSlugValue }, { examSlugs: examSlugValue }] },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [materials, total] = await Promise.all([
    StudyMaterial.find(filter)
      .populate('examCategoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    StudyMaterial.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: materials,
    meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  });
});

export const listCurrentAffairs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, category, exam, examSlug } = req.query;
  const ctx = await getExamFilterContext(req.user!.id, req.user!.role);
  const filter = buildCurrentAffairsFilter(ctx, { isActive: true });
  if (category) filter.category = category;
  const examSlugValue = typeof exam === 'string' ? exam : typeof examSlug === 'string' ? examSlug : undefined;
  if (examSlugValue) {
    filter.$and = [
      ...(Array.isArray(filter.$and) ? (filter.$and as unknown[]) : []),
      { $or: [{ examSlug: examSlugValue }, { examSlugs: examSlugValue }] },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [affairs, total] = await Promise.all([
    CurrentAffair.find(filter).sort({ publishedDate: -1 }).skip(skip).limit(Number(limit)).lean(),
    CurrentAffair.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: affairs,
    meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  });
});

export const getCurrentAffair = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ctx = await getExamFilterContext(req.user!.id, req.user!.role);
  const affair = await CurrentAffair.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!affair) throw new ApiError(404, 'Current affair not found');
  const slug = affair.examSlug ?? affair.examSlugs?.[0];
  if (!canAccessExamContent(ctx, slug)) {
    throw new ApiError(403, 'Content not in your selected exams');
  }
  res.json({ success: true, data: affair });
});
