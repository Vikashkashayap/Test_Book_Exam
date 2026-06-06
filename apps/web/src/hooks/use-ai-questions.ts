import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiSuccess } from '@/lib/api';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface GenerationAnalytics {
  questionsGenerated: number;
  questionsSaved: number;
  duplicatesRemoved: number;
  tokenUsage: TokenUsage;
  aiModel: string;
}

export interface BankQuestion {
  _id: string;
  exam: string;
  examSlug: string;
  subject: string;
  topic: string;
  difficulty: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  source: string;
  aiModel?: string;
  generatedAt: string;
}

export function useAiQuestionStatus() {
  return useQuery({
    queryKey: ['ai-question-status'],
    queryFn: () =>
      api<
        ApiSuccess<{
          configured: boolean;
          model: string;
          provider: string;
          maxPerRequest: number[];
        }>
      >('/admin/ai-questions/status').then((r) => r.data),
  });
}

export function useExamProfile(examId?: string) {
  return useQuery({
    queryKey: ['exam-profile', examId],
    queryFn: () =>
      api<
        ApiSuccess<{
          examSlug: string;
          examName: string;
          profile: { pattern: string; difficulty: string; subjects: string[] };
        }>
      >(`/admin/ai-questions/profile?examId=${examId}`).then((r) => r.data),
    enabled: Boolean(examId),
  });
}

export function useGenerateAiQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      examId: string;
      subject: string;
      topic: string;
      difficulty: 'easy' | 'medium' | 'hard';
      questionCount: 10 | 20 | 30;
    }) =>
      api<
        ApiSuccess<{
          questions: BankQuestion[];
          analytics: GenerationAnalytics;
          exam: { name: string; slug: string };
        }>
      >('/admin/ai-questions/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['question-bank'] });
      qc.invalidateQueries({ queryKey: ['question-bank-analytics'] });
    },
  });
}

export function useQuestionBank(params?: {
  examId?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params?.examId) search.set('examId', params.examId);
  if (params?.subject) search.set('subject', params.subject);
  if (params?.topic) search.set('topic', params.topic);
  if (params?.difficulty) search.set('difficulty', params.difficulty);
  if (params?.page) search.set('page', String(params.page));

  const qs = search.toString();

  return useQuery({
    queryKey: ['question-bank', params],
    queryFn: () =>
      api<ApiSuccess<BankQuestion[]>>(`/admin/question-bank${qs ? `?${qs}` : ''}`).then((r) => ({
        entries: r.data,
        meta: r.meta,
      })),
  });
}

export function useQuestionBankAnalytics(examSlug?: string) {
  return useQuery({
    queryKey: ['question-bank-analytics', examSlug],
    queryFn: () => {
      const q = examSlug ? `?examSlug=${encodeURIComponent(examSlug)}` : '';
      return api<
        ApiSuccess<{
          bankStats: Array<{ _id: { examSlug: string; subject: string }; count: number }>;
          analytics: {
            questionsGenerated: number;
            questionsSaved: number;
            duplicatesRemoved: number;
            totalTokens: number;
            estimatedCostUsd: number;
          };
        }>
      >(`/admin/question-bank/analytics${q}`).then((r) => r.data);
    },
  });
}
