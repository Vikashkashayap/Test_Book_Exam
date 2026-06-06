import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiSuccess } from '@/lib/api';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface PreviewQuestion {
  _id?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subject: string;
  difficulty: string;
}

export interface AITestBatch {
  _id: string;
  batchId: string;
  title: string;
  examSlug: string;
  difficulty: string;
  requestedQuestions: number;
  generatedQuestions: number;
  status: string;
  progress: number;
  subjectNames: string[];
  tokenUsage?: TokenUsage;
  aiModel: string;
  createdAt: string;
  examId?: { name: string; slug: string };
  testId?: {
    _id: string;
    title: string;
    slug: string;
    status: string;
    totalQuestions: number;
    source?: string;
    subjects?: string[];
  };
}

export interface GenerateResult {
  batch: AITestBatch;
  test: {
    _id: string;
    title: string;
    slug: string;
    status: string;
    totalQuestions: number;
    source: string;
    subjects: string[];
  };
  questions: PreviewQuestion[];
  tokenUsage: TokenUsage;
  previewCount: number;
}

export function useAiTestStatus() {
  return useQuery({
    queryKey: ['ai-test-status'],
    queryFn: () =>
      api<ApiSuccess<{ configured: boolean; model: string; provider: string }>>(
        '/admin/ai-tests/status'
      ).then((r) => r.data),
  });
}

export function useAiTestSubjects(examId?: string) {
  return useQuery({
    queryKey: ['ai-test-subjects', examId],
    queryFn: () =>
      api<ApiSuccess<{ examSlug: string; subjects: string[] }>>(
        `/admin/ai-tests/subjects?examId=${examId}`
      ).then((r) => r.data),
    enabled: Boolean(examId),
  });
}

export function useAiTestBatches(examId?: string) {
  return useQuery({
    queryKey: ['ai-test-batches', examId],
    queryFn: () => {
      const q = examId ? `?examId=${examId}&limit=20` : '?limit=20';
      return api<ApiSuccess<AITestBatch[]>>(`/admin/ai-tests${q}`).then((r) => r.data);
    },
  });
}

export function useGenerateAiTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      examId: string;
      subjects: string[];
      totalQuestions: 20 | 50 | 100 | 200;
      difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
      title?: string;
      aiModel?: string;
    }) =>
      api<ApiSuccess<GenerateResult>>('/admin/ai-tests/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-test-batches'] });
    },
  });
}

export function usePublishAiTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { testId: string; batchId?: string }) =>
      api<ApiSuccess<{ test: { _id: string; title: string; status: string }; published: boolean }>>(
        '/admin/ai-tests/publish',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-test-batches'] });
    },
  });
}

export function useAiTestPreview(batchId?: string) {
  return useQuery({
    queryKey: ['ai-test-preview', batchId],
    queryFn: () =>
      api<
        ApiSuccess<{
          batch: AITestBatch;
          questions: PreviewQuestion[];
        }>
      >(`/admin/ai-tests/preview/${batchId}`).then((r) => r.data),
    enabled: Boolean(batchId),
  });
}

export function useStudentTests(exam?: string) {
  return useQuery({
    queryKey: ['student-tests', exam],
    queryFn: () => {
      const q = exam ? `?exam=${encodeURIComponent(exam)}` : '';
      return api<
        ApiSuccess<
          Array<{
            _id: string;
            title: string;
            slug: string;
            examSlug: string;
            subjects?: string[];
            totalQuestions: number;
            durationMinutes: number;
            source?: string;
            status: string;
          }>
        >
      >(`/student/tests${q}`).then((r) => ({
        tests: r.data,
        meta: r.meta as { selectedExams?: string[] },
      }));
    },
  });
}
