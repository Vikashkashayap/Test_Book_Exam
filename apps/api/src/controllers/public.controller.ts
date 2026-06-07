import { Request, Response } from 'express';
import { EXAM_ECOSYSTEM } from '@exam-prep/shared';
import { StudyMaterial } from '../models/StudyMaterial';
import { Blog } from '../models/Blog';
import { asyncHandler } from '../utils/asyncHandler';

const PYQ_CATEGORY_SLUGS = EXAM_ECOSYSTEM.map((g) => g.slug);

const examSlugsByCategory = new Map(
  EXAM_ECOSYSTEM.map((g) => [g.slug, g.exams.map((e) => e.slug)])
);

function resolveCategoryFilter(category?: string): string | undefined {
  if (!category || category === 'all') return undefined;
  const normalized = category.toLowerCase();
  return PYQ_CATEGORY_SLUGS.includes(normalized) ? normalized : undefined;
}

export const listPublicPyq = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query;
  const categorySlug = resolveCategoryFilter(category as string | undefined);

  const filter: Record<string, unknown> = {
    type: 'previous_year_pdf',
    isActive: true,
  };

  if (categorySlug) {
    const examSlugs = examSlugsByCategory.get(categorySlug) ?? [];
    filter.$or = [{ categorySlug }, ...(examSlugs.length ? [{ examSlug: { $in: examSlugs } }] : [])];
  }

  const materials = await StudyMaterial.find(filter)
    .populate('examId', 'name slug')
    .sort({ year: -1, createdAt: -1 })
    .lean();

  const seen = new Set<string>();
  const papers = materials
    .filter((m) => {
      const key = m._id.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((m) => ({
      id: m._id.toString(),
      title: m.title,
      exam: (m.examId as { name?: string } | null)?.name ?? m.examSlug,
      examSlug: m.examSlug,
      categorySlug: m.categorySlug,
      year: m.year ?? null,
      fileUrl: m.fileUrl,
      description: m.description ?? '',
    }));

  const yearMap = new Map<number, typeof papers>();
  for (const paper of papers) {
    const year = paper.year ?? 0;
    if (!yearMap.has(year)) yearMap.set(year, []);
    yearMap.get(year)!.push(paper);
  }

  const years = [...yearMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, yearPapers]) => ({
      year: year === 0 ? null : year,
      papers: yearPapers,
    }));

  res.json({ success: true, data: { years, total: papers.length } });
});

export const listPublicBlogs = asyncHandler(async (req: Request, res: Response) => {
  const { limit = '6' } = req.query;
  const maxLimit = Math.min(Number(limit) || 6, 50);

  const blogs = await Blog.find({ isPublished: true, showOnHomepage: true })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(maxLimit)
    .select('_id title slug excerpt imageUrl author category publishedAt')
    .lean();

  const data = blogs.map((b) => ({
    id: b._id.toString(),
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt ?? '',
    imageUrl: b.imageUrl ?? null,
    author: b.author ?? 'MentorsDaily Team',
    category: b.category ?? 'General',
    publishedAt: b.publishedAt ?? b.createdAt,
  }));

  res.json({ success: true, data });
});

export const getPublicBlog = asyncHandler(async (req: Request, res: Response) => {
  const blog = await Blog.findOne({
    slug: req.params.slug,
    isPublished: true,
  })
    .select('_id title slug excerpt content imageUrl author category publishedAt')
    .lean();

  if (!blog) {
    return res.status(404).json({ success: false, error: 'Blog not found' });
  }

  res.json({
    success: true,
    data: {
      id: blog._id.toString(),
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt ?? '',
      content: blog.content,
      imageUrl: blog.imageUrl ?? null,
      author: blog.author ?? 'MentorsDaily Team',
      category: blog.category ?? 'General',
      publishedAt: blog.publishedAt ?? blog.createdAt,
    },
  });
});
