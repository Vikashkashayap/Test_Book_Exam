import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ExamCategory } from '../models/ExamCategory';
import { Exam } from '../models/Exam';
import { User } from '../models/User';
import { Test } from '../models/Test';
import { StudyMaterial } from '../models/StudyMaterial';
import { CurrentAffair } from '../models/CurrentAffair';
import { asyncHandler } from '../utils/asyncHandler';
import { EXAM_ECOSYSTEM } from '@exam-prep/shared';
import {
  buildExamContentFilter,
  buildCurrentAffairsFilter,
  matchesExamSlug,
} from '../services/exam-filter.service';
import { getOfficialExamSlugs } from '../services/exam-official.service';

export const getExamEcosystem = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const dbCategories = await ExamCategory.find({ isActive: true }).sort({ order: 1 }).lean();
  const dbExams = await Exam.find({ isActive: true }).sort({ order: 1 }).lean();

  if (dbExams.length > 0) {
    const officialSlugs = new Set(EXAM_ECOSYSTEM.map((g) => g.slug));
    const grouped = dbCategories
      .filter((cat) => officialSlugs.has(cat.slug))
      .map((cat) => ({
        ...cat,
        exams: dbExams.filter((e) => e.categoryId.toString() === cat._id.toString()),
      }));
    return res.json({ success: true, data: grouped });
  }

  res.json({ success: true, data: EXAM_ECOSYSTEM });
});

export const listExams = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { categorySlug, search } = req.query;
  const filter: Record<string, unknown> = {
    isActive: true,
    slug: { $in: [...getOfficialExamSlugs()] },
  };
  if (categorySlug) filter.categorySlug = categorySlug;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const exams = await Exam.find(filter).sort({ order: 1 }).populate('categoryId', 'name slug icon').lean();
  res.json({ success: true, data: exams });
});

export const getPersonalizedDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id).populate('selectedExams', 'name slug categorySlug');
  if (!user) {
    return res.json({ success: true, data: { sections: [], exams: [], message: 'Complete onboarding' } });
  }

  const examSlugs = user.selectedExamSlugs?.length
    ? user.selectedExamSlugs
    : user.selectedExams?.map((e) => (typeof e === 'object' && e && 'slug' in e ? (e as { slug: string }).slug : '')).filter(Boolean) ?? [];

  if (!examSlugs.length) {
    return res.json({
      success: true,
      data: {
        exams: [],
        sections: [],
        needsOnboarding: !user.onboardingCompleted,
        stats: null,
      },
    });
  }

  const exams = await Exam.find({ slug: { $in: examSlugs } }).lean();

  const now = new Date();
  await Test.updateMany(
    {
      status: 'scheduled',
      scheduledAt: { $lte: now },
      examSlug: { $in: examSlugs },
    },
    { $set: { status: 'published', publishedAt: now, isLive: true } }
  );

  const testFilter = buildExamContentFilter(
    { examSlugs, isAdmin: false },
    { status: 'published' }
  );
  const materialFilter = buildExamContentFilter({ examSlugs, isAdmin: false }, { isActive: true });
  const affairFilter = buildCurrentAffairsFilter({ examSlugs, isAdmin: false }, { isActive: true });

  const [tests, materials, affairs] = await Promise.all([
    Test.find(testFilter)
      .limit(50)
      .select('title slug type totalQuestions durationMinutes examSlug examSlugs status publishedAt')
      .lean(),
    StudyMaterial.find(materialFilter)
      .limit(30)
      .select('title slug type fileUrl examSlug examSlugs')
      .lean(),
    CurrentAffair.find(affairFilter)
      .sort({ publishedDate: -1 })
      .limit(30)
      .select('title slug summary category publishedDate examSlug examSlugs')
      .lean(),
  ]);

  const sections = exams.flatMap((exam) => {
    const examTests = tests.filter((t) => matchesExamSlug(t, exam.slug));
    const examMaterials = materials.filter((m) => matchesExamSlug(m, exam.slug));
    const examAffairs = affairs.filter((a) => matchesExamSlug(a, exam.slug));

    return [
    {
      examSlug: exam.slug,
      examName: exam.name,
      title: `${exam.name} Mock Tests`,
      type: 'tests' as const,
      href: `/tests?exam=${exam.slug}&type=full_length`,
      items: examTests.filter((t) => t.type === 'full_length').slice(0, 4),
    },
    {
      examSlug: exam.slug,
      examName: exam.name,
      title: `${exam.name} PYQ`,
      type: 'pyq' as const,
      href: `/tests?exam=${exam.slug}&type=previous_year`,
      items: examTests.filter((t) => t.type === 'previous_year').slice(0, 4),
    },
    {
      examSlug: exam.slug,
      examName: exam.name,
      title: `${exam.name} Current Affairs`,
      type: 'current_affairs' as const,
      href: `/current-affairs?exam=${exam.slug}`,
      items: examAffairs.slice(0, 4),
    },
    {
      examSlug: exam.slug,
      examName: exam.name,
      title: `${exam.name} Notes`,
      type: 'notes' as const,
      href: `/study-materials?exam=${exam.slug}`,
      items: examMaterials.filter((m) => m.type === 'pdf_notes').slice(0, 4),
    },
    {
      examSlug: exam.slug,
      examName: exam.name,
      title: `${exam.name} Daily Quiz`,
      type: 'quiz' as const,
      href: `/tests?exam=${exam.slug}&type=daily_quiz`,
      items: examTests.filter((t) => t.type === 'daily_quiz').slice(0, 2),
    },
  ];
  });

  res.json({
    success: true,
    data: {
      exams: exams.map((e) => ({ name: e.name, slug: e.slug, categorySlug: e.categorySlug })),
      sections,
      needsOnboarding: false,
      primaryExam: exams[0]?.name,
    },
  });
});

export const updateSelectedExams = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examSlugs, categorySlugs } = req.body;
  if (!Array.isArray(examSlugs) || examSlugs.length === 0) {
    return res.status(400).json({ success: false, error: 'Select at least one exam' });
  }

  const exams = await Exam.find({ slug: { $in: examSlugs }, isActive: true });
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    {
      selectedExams: exams.map((e) => e._id),
      selectedExamSlugs: exams.map((e) => e.slug),
      selectedCategorySlugs: categorySlugs ?? [...new Set(exams.map((e) => e.categorySlug))],
      onboardingCompleted: true,
      onboardingStep: 3,
      'preferences.examCategories': [...new Set(exams.map((e) => e.categoryId))],
    },
    { new: true }
  ).select('-password -refreshTokens');

  res.json({ success: true, data: user });
});
