import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiSuccess } from '@/lib/api';

export interface BankAvailability {
  examSlug: string;
  examName?: string;
  total: number;
  breakdown: Array<{
    _id: { subject: string; difficulty: string };
    count: number;
  }>;
}

export interface BuiltTest {
  _id: string;
  title: string;
  slug: string;
  exam: string;
  examSlug: string;
  subjects: string[];
  duration: number;
  totalQuestions: number;
  source: string;
  status: string;
  scheduledAt?: string;
  createdAt: string;
}

export interface ExamSectionInfo {
  name: string;
  questionCount: number;
}

export interface ExamPatternInfo {
  examSlug: string;
  examName: string;
  mockType: string;
  pattern: {
    totalQuestions: number;
    totalMarks: number;
    durationMinutes: number;
    negativeMarking: boolean;
    negativeMarkingLabel: string;
    hasTimer: boolean;
    difficulty: string;
    questionStyle: string;
    questionStyles: string[];
    sections: Array<{
      name: string;
      questionCount: number;
      marksPerQuestion: number;
      negativeMarks: number;
    }>;
    subjects: string[];
    instructions: string;
  };
}

export function useExamPattern(
  examId?: string,
  mockType?: string,
  subject?: string
) {
  const search = new URLSearchParams();
  if (examId) search.set('examId', examId);
  if (mockType) search.set('mockType', mockType);
  if (subject) search.set('subject', subject);

  return useQuery({
    queryKey: ['exam-pattern', examId, mockType, subject],
    queryFn: () =>
      api<ApiSuccess<ExamPatternInfo>>(
        `/admin/tests/pattern?${search.toString()}`
      ).then((r) => r.data),
    enabled: Boolean(examId),
  });
}

export function useTestBuilderSubjects(examId?: string) {
  return useQuery({
    queryKey: ['test-builder-subjects', examId],
    queryFn: () =>
      api<ApiSuccess<{ examSlug: string; subjects: string[]; sections?: ExamSectionInfo[] }>>(
        `/admin/tests/subjects?examId=${examId}`
      ).then((r) => r.data),
    enabled: Boolean(examId),
  });
}

export function useBankAvailability(
  examId?: string,
  subjects?: string[],
  difficulty?: string,
  avoidReuse?: boolean
) {
  const search = new URLSearchParams();
  if (examId) search.set('examId', examId);
  if (subjects?.length) search.set('subjects', subjects.join(','));
  if (difficulty) search.set('difficulty', difficulty);
  if (avoidReuse) search.set('avoidReuse', 'true');

  return useQuery({
    queryKey: ['bank-availability', examId, subjects, difficulty, avoidReuse],
    queryFn: () =>
      api<ApiSuccess<BankAvailability>>(
        `/admin/tests/availability?${search.toString()}`
      ).then((r) => r.data),
    enabled: Boolean(examId),
  });
}

export interface AdminMock {
  id: string;
  type: 'test' | 'job';
  title: string;
  examSlug: string;
  examName: string;
  subjects: string[];
  totalQuestions: number;
  durationMinutes: number;
  status: string;
  isLive: boolean;
  attemptCount: number;
  scheduledAt?: string;
  publishedAt?: string | null;
  createdAt: string;
  source?: string;
}

export function useAdminMocks(params?: {
  examId?: string;
  difficulty?: string;
  search?: string;
}) {
  const search = new URLSearchParams();
  if (params?.examId) search.set('examId', params.examId);
  if (params?.difficulty) search.set('difficulty', params.difficulty);
  if (params?.search) search.set('search', params.search);

  const qs = search.toString();

  return useQuery({
    queryKey: ['admin-mocks', params],
    queryFn: () =>
      api<ApiSuccess<AdminMock[]>>(`/admin/tests/mocks${qs ? `?${qs}` : ''}`).then((r) => ({
        mocks: r.data,
        meta: r.meta,
      })),
    refetchInterval: 30_000,
  });
}

export function useDeleteAdminMock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'test' | 'job' }) =>
      api<ApiSuccess<{ cancelled?: boolean; archived?: boolean }>>(
        `/admin/tests/mocks/${id}?type=${type}`,
        { method: 'DELETE' }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-mocks'] });
      qc.invalidateQueries({ queryKey: ['bank-availability'] });
    },
  });
}

export function useCreateTestFromBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      examId: string;
      subjects?: string[];
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
      questionCount?: number;
      durationMinutes?: number;
      title?: string;
      mockType?: 'subject_based' | 'full_length' | 'practice_set' | 'subject_test';
      avoidReuse?: boolean;
      autoGenerate?: boolean;
      scheduledAt?: string;
    }) =>
      api<
        ApiSuccess<{
          test: BuiltTest;
          questions: Array<{
            question: string;
            options: string[];
            correctAnswer: string;
            subject: string;
            topic: string;
          }>;
          questionsAutoGenerated: number;
          scheduled: boolean;
          message: string;
        }>
      >('/admin/tests/create', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-availability'] });
      qc.invalidateQueries({ queryKey: ['question-bank'] });
      qc.invalidateQueries({ queryKey: ['admin-mocks'] });
    },
  });
}
