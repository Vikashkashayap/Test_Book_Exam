import { EXAM_ECOSYSTEM, flattenExams } from '@exam-prep/shared';

export function getOfficialExamSlugs(): Set<string> {
  return new Set(flattenExams().map((e) => e.slug));
}

export function getOfficialCategorySlugs(): Set<string> {
  return new Set(EXAM_ECOSYSTEM.map((g) => g.slug));
}

/** Junk exams manually added outside the official taxonomy */
export const JUNK_EXAM_SLUGS = ['abc', 'bankings', 'up-ploce'] as const;
