/** Government exam pattern engine — core types */

export type ExamPattern =
  | 'objective'
  | 'statement_based'
  | 'police'
  | 'banking'
  | 'teaching'
  | 'defence'
  | 'descriptive';

export type ProfileDifficulty =
  | 'easy'
  | 'easy_moderate'
  | 'moderate'
  | 'moderate_hard'
  | 'hard';

export type QuestionStyle =
  | 'statement_based'
  | 'conceptual'
  | 'analytical'
  | 'factual'
  | 'comprehension'
  | 'numerical';

export type NegativeMarkingRule =
  | { type: 'none' }
  | { type: 'fixed'; value: number }
  | { type: 'fraction'; numerator: number; denominator: number }
  | { type: 'as_per_pattern' };

export type MockMode = 'full_length' | 'subject_test' | 'practice_set';

/** API / legacy alias */
export type MockType = MockMode | 'subject_based';

export interface ExamSection {
  name: string;
  questionCount: number;
  /** Overrides exam-level marks per question for this section */
  marksPerQuestion?: number;
}

export interface ExamPatternProfile {
  slug: string;
  name: string;
  categorySlug: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  negativeMarking: NegativeMarkingRule;
  sections: ExamSection[];
  pattern: ExamPattern;
  difficulty: ProfileDifficulty;
  difficultyPattern?: string;
  questionStyles?: QuestionStyle[];
  instructions?: string;
}

/** Legacy AI profile shape (subjects + pattern metadata) */
export interface ExamProfile {
  slug: string;
  name: string;
  categorySlug: string;
  pattern: ExamPattern;
  subjects: string[];
  difficulty: ProfileDifficulty;
  questionStyles?: QuestionStyle[];
}

export interface SectionBuildConfig {
  subject: string;
  questionCount: number;
  marksPerQuestion: number;
  negativeMarks: number;
}

export interface BuiltTestPattern {
  examSlug: string;
  examName: string;
  categorySlug: string;
  mockType: MockMode;
  subjects: string[];
  sectionDistribution: SectionBuildConfig[];
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  negativeMarking: boolean;
  marksPerQuestion: number;
  defaultNegativeMarks: number;
  difficulty: ProfileDifficulty;
  pattern: ExamPattern;
  questionStyles: QuestionStyle[];
  instructions: string;
  hasTimer: boolean;
}
