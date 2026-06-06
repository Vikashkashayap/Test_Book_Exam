import { create } from 'zustand';

export type AnswerStatus = 'answered' | 'not_answered' | 'marked_for_review' | 'answered_marked';

export interface QuestionForAttempt {
  _id: string;
  type: string;
  text: string;
  textHi?: string;
  options: { id: string; text: string; textHi?: string }[];
  marks: number;
  negativeMarks: number;
}

export interface AttemptAnswer {
  questionId: string;
  answer: string | string[] | number | null;
  status: AnswerStatus;
  timeSpentSeconds: number;
}

export interface TestMeta {
  title: string;
  totalMarks: number;
  totalQuestions: number;
  durationMinutes: number;
  negativeMarking: boolean;
  hasTimer: boolean;
  instructions?: string;
  type?: string;
}

interface TestAttemptState {
  attemptId: string | null;
  testId: string | null;
  questions: QuestionForAttempt[];
  answers: AttemptAnswer[];
  currentIndex: number;
  timeRemainingSeconds: number;
  isFullScreen: boolean;
  negativeMarking: boolean;
  hasTimer: boolean;
  testMeta: TestMeta | null;
  initAttempt: (payload: {
    attemptId: string;
    testId: string;
    questions: QuestionForAttempt[];
    answers: AttemptAnswer[];
    timeRemainingSeconds: number;
    negativeMarking: boolean;
    hasTimer: boolean;
    testMeta?: TestMeta | null;
  }) => void;
  setAnswer: (questionId: string, answer: unknown, status?: AnswerStatus) => void;
  markForReview: (questionId: string) => void;
  goToQuestion: (index: number) => void;
  next: () => void;
  previous: () => void;
  tick: () => void;
  toggleFullScreen: () => void;
  reset: () => void;
}

export const useTestAttemptStore = create<TestAttemptState>((set, get) => ({
  attemptId: null,
  testId: null,
  questions: [],
  answers: [],
  currentIndex: 0,
  timeRemainingSeconds: 0,
  isFullScreen: false,
  negativeMarking: true,
  hasTimer: true,
  testMeta: null,

  initAttempt: (payload) => set({ ...payload }),

  setAnswer: (questionId, answer, status = 'answered') =>
    set((s) => ({
      answers: s.answers.map((a) =>
        a.questionId === questionId
          ? { ...a, answer: answer as AttemptAnswer['answer'], status }
          : a
      ),
    })),

  markForReview: (questionId) =>
    set((s) => ({
      answers: s.answers.map((a) => {
        if (a.questionId !== questionId) return a;
        const hasAnswer = a.answer !== null && a.answer !== '';
        return {
          ...a,
          status: hasAnswer ? 'answered_marked' : 'marked_for_review',
        };
      }),
    })),

  goToQuestion: (index) => set({ currentIndex: index }),
  next: () => set((s) => ({ currentIndex: Math.min(s.currentIndex + 1, s.questions.length - 1) })),
  previous: () => set((s) => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),

  tick: () =>
    set((s) => {
      if (s.timeRemainingSeconds <= 0) return s;
      return { timeRemainingSeconds: s.timeRemainingSeconds - 1 };
    }),

  toggleFullScreen: () => {
    const next = !get().isFullScreen;
    if (typeof document !== 'undefined') {
      if (next) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
    set({ isFullScreen: next });
  },

  reset: () =>
    set({
      attemptId: null,
      testId: null,
      questions: [],
      answers: [],
      currentIndex: 0,
      timeRemainingSeconds: 0,
      isFullScreen: false,
      hasTimer: true,
      testMeta: null,
    }),
}));
