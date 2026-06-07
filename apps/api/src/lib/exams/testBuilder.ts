import type {
  BuiltTestPattern,
  ExamPatternProfile,
  ExamSection,
  MockMode,
  MockType,
  SectionBuildConfig,
} from './types';
import { getExamPatternProfile } from './examProfiles';
import {
  formatNegativeMarkingLabel,
  isNegativeMarkingEnabled,
  resolveNegativeMarks,
} from './scoring';

const PRACTICE_SET_QUESTIONS = 20;

/** Subject name aliases for bank matching */
export const SUBJECT_ALIASES: Record<string, string[]> = {
  GK: ['General Awareness', 'General Knowledge', 'GA', 'GK'],
  Maths: ['Quantitative Aptitude', 'Quant', 'Mathematics', 'Numerical', 'Maths'],
  English: ['English Language', 'English Comprehension', 'English'],
  Reasoning: ['General Intelligence', 'Logical Reasoning', 'Reasoning', 'General Intelligence & Reasoning'],
  Quant: ['Quantitative Aptitude', 'Quant', 'Mathematics', 'Maths'],
  'Hindi/English': ['Hindi', 'English', 'Hindi/English'],
  CDP: ['Child Development & Pedagogy', 'CDP'],
  EVS: ['Environmental Studies', 'EVS'],
  'Language 1': ['Language I', 'Language 1', 'Language'],
  'Language 2': ['Language II', 'Language 2'],
  Science: ['General Science', 'Science'],
  'Current Affairs': ['Current Affairs', 'Current Events'],
  Polity: ['Indian Polity', 'Polity'],
  Comprehension: ['English Comprehension', 'Comprehension'],
  GAT: ['General Ability Test', 'GAT', 'General Knowledge', 'English', 'Reasoning'],
};

export function normalizeMockType(type?: MockType): MockMode {
  if (type === 'practice_set') return 'practice_set';
  if (type === 'full_length' || type === 'pyq') return 'full_length';
  return 'subject_test';
}

export function isPyqMockType(type?: MockType): boolean {
  return type === 'pyq';
}

function defaultMarksPerQuestion(profile: ExamPatternProfile, section?: ExamSection): number {
  if (section?.marksPerQuestion) return section.marksPerQuestion;
  return profile.totalMarks / profile.totalQuestions;
}

function buildSectionConfig(
  profile: ExamPatternProfile,
  section: ExamSection
): SectionBuildConfig {
  const marksPerQuestion = defaultMarksPerQuestion(profile, section);
  const negativeMarks = resolveNegativeMarks(profile.negativeMarking, marksPerQuestion);
  return {
    subject: section.name,
    questionCount: section.questionCount,
    marksPerQuestion: round2(marksPerQuestion),
    negativeMarks: round2(negativeMarks),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function findSectionForSubject(
  profile: ExamPatternProfile,
  subjectName: string
): ExamSection | undefined {
  const normalized = subjectName.toLowerCase();
  return profile.sections.find((s) => {
    const aliases = SUBJECT_ALIASES[s.name] ?? [s.name];
    return aliases.some(
      (a) =>
        a.toLowerCase() === normalized ||
        normalized.includes(a.toLowerCase()) ||
        a.toLowerCase().includes(normalized)
    );
  });
}

function buildInstructions(
  profile: ExamPatternProfile,
  mode: MockMode,
  sections: SectionBuildConfig[],
  options?: { isPyq?: boolean }
): string {
  const negLabel = formatNegativeMarkingLabel(
    profile.negativeMarking,
    profile.totalMarks / profile.totalQuestions
  );

  if (options?.isPyq) {
    const sectionLines = sections
      .map((s) => `• ${s.subject}: ${s.questionCount} questions (${s.marksPerQuestion} marks each)`)
      .join('\n');
    return [
      `Previous Year Paper (PYQ) — ${profile.name}`,
      `Total Questions: ${profile.totalQuestions} | Total Marks: ${profile.totalMarks} | Duration: ${profile.durationMinutes} minutes`,
      negLabel,
      '',
      'Section Distribution:',
      sectionLines,
      '',
      'AI-generated questions in the style of official previous year papers.',
      '• Each question has only ONE correct answer.',
      '• Use the question palette to navigate. Mark for review if unsure.',
      '• Test will auto-submit when the timer expires.',
    ].join('\n');
  }

  if (mode === 'practice_set') {
    return [
      `Practice Set — ${profile.name}`,
      `${PRACTICE_SET_QUESTIONS} questions, no time limit, no negative marking.`,
      'Use this set to revise concepts at your own pace.',
    ].join('\n');
  }

  if (mode === 'subject_test') {
    const sec = sections[0];
    return [
      `Subject Test — ${profile.name}`,
      `Subject: ${sec?.subject ?? 'Selected subject'}`,
      `Questions: ${sections.reduce((s, x) => s + x.questionCount, 0)}`,
      `Duration: ${Math.ceil((profile.durationMinutes * (sections[0]?.questionCount ?? 1)) / profile.totalQuestions)} minutes`,
      negLabel,
      'Mark questions for review and submit when done. Test auto-submits when timer ends.',
    ].join('\n');
  }

  const sectionLines = sections
    .map((s) => `• ${s.subject}: ${s.questionCount} questions (${s.marksPerQuestion} marks each)`)
    .join('\n');

  const styleNote =
    profile.questionStyles?.length &&
    profile.pattern === 'statement_based'
      ? `\nQuestion style: ${profile.questionStyles.join(', ')}.`
      : '';

  return [
    `Full Length Mock — ${profile.name}`,
    `Total Questions: ${profile.totalQuestions} | Total Marks: ${profile.totalMarks} | Duration: ${profile.durationMinutes} minutes`,
    negLabel,
    '',
    'Section Distribution:',
    sectionLines,
    styleNote,
    '',
    'Instructions:',
    '• Each question has only ONE correct answer unless stated otherwise.',
    '• Use the question palette to navigate. Mark for review if unsure.',
    '• Test will auto-submit when the timer expires.',
    profile.instructions ?? '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildTestPattern(params: {
  examSlug: string;
  categorySlug: string;
  examName: string;
  mockType?: MockType;
  selectedSubjects?: string[];
}): BuiltTestPattern {
  const mode = normalizeMockType(params.mockType);
  const isPyq = isPyqMockType(params.mockType);
  const profile = getExamPatternProfile(params.examSlug, params.categorySlug, params.examName);

  if (mode === 'practice_set') {
    const subjects =
      params.selectedSubjects?.length
        ? params.selectedSubjects
        : profile.sections.map((s) => s.name);
    const perSubject = Math.ceil(PRACTICE_SET_QUESTIONS / subjects.length);
    const sectionDistribution: SectionBuildConfig[] = subjects.map((subject, i) => {
      const count =
        i === subjects.length - 1
          ? PRACTICE_SET_QUESTIONS - perSubject * (subjects.length - 1)
          : perSubject;
      return {
        subject,
        questionCount: count,
        marksPerQuestion: 1,
        negativeMarks: 0,
      };
    });

    return {
      examSlug: params.examSlug,
      examName: params.examName,
      categorySlug: params.categorySlug,
      mockType: 'practice_set',
      subjects,
      sectionDistribution,
      totalQuestions: PRACTICE_SET_QUESTIONS,
      totalMarks: PRACTICE_SET_QUESTIONS,
      durationMinutes: 0,
      negativeMarking: false,
      marksPerQuestion: 1,
      defaultNegativeMarks: 0,
      difficulty: profile.difficulty,
      pattern: profile.pattern,
      questionStyles: profile.questionStyles ?? [],
      instructions: buildInstructions(profile, 'practice_set', sectionDistribution),
      hasTimer: false,
    };
  }

  if (mode === 'subject_test') {
    const selected = params.selectedSubjects ?? [];
    // Preview mode: no subject yet → use first section from official pattern
    const targetSubject = selected[0] ?? profile.sections[0]?.name;
    if (!targetSubject) {
      throw new Error('No subjects defined for this exam pattern');
    }

    const matched = findSectionForSubject(profile, targetSubject);
    const questionCount = matched?.questionCount ?? Math.ceil(profile.totalQuestions / profile.sections.length);
    const marksPerQuestion = defaultMarksPerQuestion(profile, matched);
    const negativeMarks = resolveNegativeMarks(profile.negativeMarking, marksPerQuestion);
    const durationMinutes = Math.max(
      15,
      Math.round((profile.durationMinutes * questionCount) / profile.totalQuestions)
    );

    const sectionDistribution: SectionBuildConfig[] = [
      {
        subject: matched?.name ?? targetSubject,
        questionCount,
        marksPerQuestion: round2(marksPerQuestion),
        negativeMarks: round2(negativeMarks),
      },
    ];

    const negEnabled = isNegativeMarkingEnabled(profile.negativeMarking);

    return {
      examSlug: params.examSlug,
      examName: params.examName,
      categorySlug: params.categorySlug,
      mockType: 'subject_test',
      subjects: [sectionDistribution[0].subject],
      sectionDistribution,
      totalQuestions: questionCount,
      totalMarks: round2(questionCount * marksPerQuestion),
      durationMinutes,
      negativeMarking: negEnabled,
      marksPerQuestion: round2(marksPerQuestion),
      defaultNegativeMarks: round2(negativeMarks),
      difficulty: profile.difficulty,
      pattern: profile.pattern,
      questionStyles: profile.questionStyles ?? [],
      instructions: buildInstructions(profile, 'subject_test', sectionDistribution),
      hasTimer: true,
    };
  }

  // full_length / pyq — exact official pattern
  const sectionDistribution = profile.sections.map((s) => buildSectionConfig(profile, s));
  const negEnabled = isNegativeMarkingEnabled(profile.negativeMarking);
  const defaultMarks = defaultMarksPerQuestion(profile);
  return {
    examSlug: params.examSlug,
    examName: params.examName,
    categorySlug: params.categorySlug,
    mockType: 'full_length',
    subjects: sectionDistribution.map((s) => s.subject),
    sectionDistribution,
    totalQuestions: profile.totalQuestions,
    totalMarks: profile.totalMarks,
    durationMinutes: profile.durationMinutes,
    negativeMarking: negEnabled,
    marksPerQuestion: round2(defaultMarks),
    defaultNegativeMarks: round2(resolveNegativeMarks(profile.negativeMarking, defaultMarks)),
    difficulty: profile.difficulty,
    pattern: profile.pattern,
    questionStyles: profile.questionStyles ?? [],
    instructions: buildInstructions(profile, 'full_length', sectionDistribution, {
      isPyq,
    }),
    hasTimer: true,
  };
}

/** Map profile difficulty to AI generation difficulty */
export function toGenerationDifficulty(
  difficulty: string
): 'easy' | 'medium' | 'hard' {
  const map: Record<string, 'easy' | 'medium' | 'hard'> = {
    easy: 'easy',
    easy_moderate: 'easy',
    moderate: 'medium',
    moderate_hard: 'hard',
    hard: 'hard',
    medium: 'medium',
    mixed: 'medium',
  };
  return map[difficulty] ?? 'medium';
}

export function formatDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: 'Easy',
    easy_moderate: 'Easy-Moderate',
    moderate: 'Medium',
    moderate_hard: 'Moderate-Hard',
    hard: 'Hard',
    medium: 'Medium',
    mixed: 'Mixed',
  };
  return labels[difficulty] ?? 'Medium';
}
