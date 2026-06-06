/** Backward-compatible re-exports — canonical source: `../exams/` */
export {
  EXAM_PROFILES,
  EXAM_PATTERN_PROFILES,
  getExamProfile,
  getExamPatternProfile,
  getExamSubjectsFromProfile,
} from '../exams/examProfiles';

export { toGenerationDifficulty, formatDifficultyLabel } from '../exams/testBuilder';

export type {
  ExamPattern,
  ProfileDifficulty,
  ExamProfile,
  ExamPatternProfile,
  MockMode,
  MockType,
  BuiltTestPattern,
  QuestionStyle,
} from '../exams/types';
