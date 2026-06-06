import { EXAM_ECOSYSTEM } from '@exam-prep/shared';
import type {
  ExamPattern,
  ExamPatternProfile,
  ExamProfile,
  ExamSection,
  NegativeMarkingRule,
  ProfileDifficulty,
} from './types';

type PatternTemplate = Omit<ExamPatternProfile, 'slug' | 'name' | 'categorySlug'>;

const neg = {
  none: (): NegativeMarkingRule => ({ type: 'none' }),
  fixed: (value: number): NegativeMarkingRule => ({ type: 'fixed', value }),
  third: (): NegativeMarkingRule => ({ type: 'fraction', numerator: 1, denominator: 3 }),
  official: (): NegativeMarkingRule => ({ type: 'as_per_pattern' }),
};

function sectionsEqual(names: string[], total: number): ExamSection[] {
  const each = Math.floor(total / names.length);
  const remainder = total % names.length;
  return names.map((name, i) => ({
    name,
    questionCount: each + (i < remainder ? 1 : 0),
  }));
}

// ─── Official exam pattern templates ─────────────────────────────────────────

const SSC_CGL: PatternTemplate = {
  totalQuestions: 100,
  totalMarks: 200,
  durationMinutes: 60,
  negativeMarking: neg.fixed(0.5),
  sections: sectionsEqual(['Reasoning', 'GK', 'Maths', 'English'], 100),
  pattern: 'objective',
  difficulty: 'moderate',
  difficultyPattern: 'Balanced across all four sections',
};

const SSC_CHSL: PatternTemplate = { ...SSC_CGL };

const SSC_GD: PatternTemplate = {
  totalQuestions: 80,
  totalMarks: 160,
  durationMinutes: 60,
  negativeMarking: neg.fixed(0.5),
  sections: sectionsEqual(['Reasoning', 'GK', 'Maths', 'Hindi/English'], 80),
  pattern: 'objective',
  difficulty: 'easy_moderate',
};

const SSC_MTS: PatternTemplate = {
  totalQuestions: 90,
  totalMarks: 270,
  durationMinutes: 90,
  negativeMarking: neg.official(),
  sections: [
    { name: 'GK', questionCount: 25 },
    { name: 'English', questionCount: 25 },
    { name: 'Maths', questionCount: 25 },
    { name: 'Reasoning', questionCount: 15 },
  ],
  pattern: 'objective',
  difficulty: 'moderate',
  difficultyPattern: 'SSC MTS Tier-1 official distribution',
};

const RRB_NTPC: PatternTemplate = {
  totalQuestions: 100,
  totalMarks: 100,
  durationMinutes: 90,
  negativeMarking: neg.third(),
  sections: [
    { name: 'Maths', questionCount: 30 },
    { name: 'Reasoning', questionCount: 30 },
    { name: 'GK', questionCount: 40 },
  ],
  pattern: 'objective',
  difficulty: 'moderate',
};

const RRB_GROUP_D: PatternTemplate = {
  totalQuestions: 100,
  totalMarks: 100,
  durationMinutes: 90,
  negativeMarking: neg.third(),
  sections: sectionsEqual(['Maths', 'Reasoning', 'GK', 'Science'], 100),
  pattern: 'objective',
  difficulty: 'easy_moderate',
};

const IBPS_PO: PatternTemplate = {
  totalQuestions: 100,
  totalMarks: 100,
  durationMinutes: 60,
  negativeMarking: neg.fixed(0.25),
  sections: [
    { name: 'English', questionCount: 30 },
    { name: 'Quant', questionCount: 35 },
    { name: 'Reasoning', questionCount: 35 },
  ],
  pattern: 'banking',
  difficulty: 'moderate_hard',
};

const BANKING_CLERK: PatternTemplate = {
  totalQuestions: 100,
  totalMarks: 100,
  durationMinutes: 60,
  negativeMarking: neg.fixed(0.25),
  sections: [
    { name: 'English', questionCount: 30 },
    { name: 'Quant', questionCount: 35 },
    { name: 'Reasoning', questionCount: 35 },
  ],
  pattern: 'banking',
  difficulty: 'moderate',
};

const UP_POLICE: PatternTemplate = {
  totalQuestions: 150,
  totalMarks: 300,
  durationMinutes: 120,
  negativeMarking: neg.fixed(0.5),
  sections: sectionsEqual(['GK', 'Hindi', 'Reasoning', 'Current Affairs'], 150),
  pattern: 'police',
  difficulty: 'easy_moderate',
};

const DELHI_POLICE: PatternTemplate = {
  totalQuestions: 100,
  totalMarks: 100,
  durationMinutes: 90,
  negativeMarking: neg.fixed(0.25),
  sections: sectionsEqual(['GK', 'Reasoning', 'Maths', 'Hindi'], 100),
  pattern: 'police',
  difficulty: 'moderate',
};

const CTET: PatternTemplate = {
  totalQuestions: 150,
  totalMarks: 150,
  durationMinutes: 150,
  negativeMarking: neg.none(),
  sections: sectionsEqual(['CDP', 'Maths', 'EVS', 'Language 1', 'Language 2'], 150),
  pattern: 'teaching',
  difficulty: 'moderate',
};

const NDA: PatternTemplate = {
  totalQuestions: 270,
  totalMarks: 900,
  durationMinutes: 300,
  negativeMarking: neg.official(),
  sections: [
    { name: 'Maths', questionCount: 120, marksPerQuestion: 2.5 },
    { name: 'GAT', questionCount: 150, marksPerQuestion: 4 },
  ],
  pattern: 'defence',
  difficulty: 'hard',
  difficultyPattern: 'Maths Paper + GAT combined full mock',
};

const CDS: PatternTemplate = {
  totalQuestions: 120,
  totalMarks: 300,
  durationMinutes: 120,
  negativeMarking: neg.official(),
  sections: [
    { name: 'English', questionCount: 40 },
    { name: 'GK', questionCount: 40 },
    { name: 'Maths', questionCount: 40 },
  ],
  pattern: 'defence',
  difficulty: 'moderate_hard',
};

const AFCAT: PatternTemplate = {
  totalQuestions: 100,
  totalMarks: 300,
  durationMinutes: 120,
  negativeMarking: neg.fixed(1),
  sections: sectionsEqual(['English', 'GK', 'Reasoning', 'Maths'], 100),
  pattern: 'defence',
  difficulty: 'moderate_hard',
};

const UPSC_PRELIMS: PatternTemplate = {
  totalQuestions: 100,
  totalMarks: 200,
  durationMinutes: 120,
  negativeMarking: neg.fixed(0.66),
  sections: sectionsEqual(
    ['Polity', 'History', 'Geography', 'Economy', 'Environment', 'Science', 'Current Affairs'],
    100
  ),
  pattern: 'statement_based',
  difficulty: 'hard',
  difficultyPattern: 'Conceptual + analytical mix',
  questionStyles: ['statement_based', 'conceptual', 'analytical'],
  instructions: 'Questions are statement-based. Read each statement carefully before answering.',
};

const UPSC_CSAT: PatternTemplate = {
  totalQuestions: 80,
  totalMarks: 200,
  durationMinutes: 120,
  negativeMarking: neg.fixed(0.83),
  sections: [
    { name: 'Reasoning', questionCount: 30 },
    { name: 'Maths', questionCount: 25 },
    { name: 'Comprehension', questionCount: 25 },
  ],
  pattern: 'statement_based',
  difficulty: 'moderate_hard',
  questionStyles: ['comprehension', 'numerical', 'analytical'],
};

const STATE_PCS: PatternTemplate = {
  totalQuestions: 150,
  totalMarks: 150,
  durationMinutes: 120,
  negativeMarking: neg.third(),
  sections: sectionsEqual(
    ['History', 'Geography', 'Polity', 'Economy', 'Current Affairs', 'Science'],
    150
  ),
  pattern: 'statement_based',
  difficulty: 'moderate_hard',
  questionStyles: ['statement_based', 'conceptual', 'factual'],
};

// Category fallbacks for exams without explicit override
const CATEGORY_TEMPLATES: Record<string, PatternTemplate> = {
  ssc: SSC_CGL,
  banking: IBPS_PO,
  railway: RRB_NTPC,
  police: UP_POLICE,
  defence: AFCAT,
  teaching: CTET,
  upsc: UPSC_PRELIMS,
  'state-pcs': STATE_PCS,
};

const EXAM_PATTERN_OVERRIDES: Record<string, PatternTemplate> = {
  'ssc-cgl': SSC_CGL,
  'ssc-chsl': SSC_CHSL,
  'ssc-gd': SSC_GD,
  'ssc-mts': SSC_MTS,
  'ssc-cpo': SSC_CGL,
  'ssc-stenographer': SSC_CHSL,
  'rrb-ntpc': RRB_NTPC,
  'rrb-group-d': RRB_GROUP_D,
  'rrb-je': RRB_NTPC,
  'ibps-po': IBPS_PO,
  'ibps-clerk': BANKING_CLERK,
  'sbi-po': IBPS_PO,
  'sbi-clerk': BANKING_CLERK,
  'rbi-assistant': BANKING_CLERK,
  'rbi-grade-b': IBPS_PO,
  'up-police': UP_POLICE,
  'delhi-police': DELHI_POLICE,
  'bihar-police': UP_POLICE,
  'mp-police': UP_POLICE,
  'rajasthan-police': DELHI_POLICE,
  ctet: CTET,
  uptet: CTET,
  dsssb: CTET,
  kvs: CTET,
  nvs: CTET,
  nda: NDA,
  cds: CDS,
  afcat: AFCAT,
  agniveer: AFCAT,
  'upsc-prelims': UPSC_PRELIMS,
  'upsc-mains': { ...UPSC_PRELIMS, pattern: 'descriptive', totalQuestions: 20, totalMarks: 250, durationMinutes: 180 },
  'upsc-optional': { ...UPSC_PRELIMS, pattern: 'descriptive', totalQuestions: 20, totalMarks: 250, durationMinutes: 180 },
  'upsc-csat': UPSC_CSAT,
  uppcs: STATE_PCS,
  bpsc: STATE_PCS,
  mppsc: STATE_PCS,
  rpsc: STATE_PCS,
  ukpsc: STATE_PCS,
};

function buildPatternProfile(
  slug: string,
  name: string,
  categorySlug: string
): ExamPatternProfile {
  const template =
    EXAM_PATTERN_OVERRIDES[slug] ?? CATEGORY_TEMPLATES[categorySlug] ?? SSC_CGL;
  return { slug, name, categorySlug, ...template };
}

export const EXAM_PATTERN_PROFILES: Record<string, ExamPatternProfile> = Object.fromEntries(
  EXAM_ECOSYSTEM.flatMap((group) =>
    group.exams.map((exam) => [
      exam.slug,
      buildPatternProfile(exam.slug, exam.name, group.slug),
    ])
  )
);

export function getExamPatternProfile(
  examSlug: string,
  categorySlug?: string,
  examName?: string
): ExamPatternProfile {
  if (EXAM_PATTERN_PROFILES[examSlug]) return EXAM_PATTERN_PROFILES[examSlug];

  const cat = categorySlug ?? 'ssc';
  const template = EXAM_PATTERN_OVERRIDES[examSlug] ?? CATEGORY_TEMPLATES[cat] ?? SSC_CGL;
  return {
    slug: examSlug,
    name: examName ?? examSlug.replace(/-/g, ' ').toUpperCase(),
    categorySlug: cat,
    ...template,
  };
}

/** Legacy AI profile — subjects + pattern metadata */
export function getExamProfile(examSlug: string, categorySlug?: string): ExamProfile {
  const p = getExamPatternProfile(examSlug, categorySlug);
  return {
    slug: p.slug,
    name: p.name,
    categorySlug: p.categorySlug,
    pattern: p.pattern,
    subjects: p.sections.map((s) => s.name),
    difficulty: p.difficulty,
    questionStyles: p.questionStyles,
  };
}

export function getExamSubjectsFromProfile(examSlug: string, categorySlug?: string): string[] {
  return getExamProfile(examSlug, categorySlug).subjects;
}

export const EXAM_PROFILES = EXAM_PATTERN_PROFILES;

export type { ExamPattern, ProfileDifficulty, ExamPatternProfile, ExamProfile };
