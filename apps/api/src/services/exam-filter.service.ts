import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';

export interface ExamFilterContext {
  examSlugs: string[];
  isAdmin: boolean;
}

export async function getExamFilterContext(
  userId: string,
  role: string
): Promise<ExamFilterContext> {
  if (role === 'admin' || role === 'super_admin' || role === 'instructor') {
    return { examSlugs: [], isAdmin: true };
  }

  const user = await User.findById(userId).select('selectedExamSlugs');
  if (!user) throw new ApiError(404, 'User not found');

  return {
    examSlugs: user.selectedExamSlugs ?? [],
    isAdmin: false,
  };
}

export function buildExamContentFilter(
  ctx: ExamFilterContext,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  if (ctx.isAdmin) return { ...extra };
  if (!ctx.examSlugs.length) {
    return { ...extra, $or: [{ examSlug: { $in: [] } }, { examSlugs: { $in: [] } }] };
  }
  return {
    ...extra,
    $or: [
      { examSlug: { $in: ctx.examSlugs } },
      { examSlugs: { $in: ctx.examSlugs } },
    ],
  };
}

export function canAccessExamContent(ctx: ExamFilterContext, examSlug?: string | null): boolean {
  if (ctx.isAdmin) return true;
  if (!examSlug) return false;
  return ctx.examSlugs.includes(examSlug);
}

export function matchesExamSlug(
  doc: { examSlug?: string; examSlugs?: string[] },
  slug: string
): boolean {
  return doc.examSlug === slug || (doc.examSlugs?.includes(slug) ?? false);
}

export function buildCurrentAffairsFilter(
  ctx: ExamFilterContext,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  if (ctx.isAdmin) return { ...extra };
  if (!ctx.examSlugs.length) {
    return { ...extra, $or: [{ examSlug: { $in: [] } }, { examSlugs: { $in: [] } }] };
  }
  return {
    ...extra,
    $or: [
      { examSlug: { $in: ctx.examSlugs } },
      { examSlugs: { $in: ctx.examSlugs } },
    ],
  };
}
