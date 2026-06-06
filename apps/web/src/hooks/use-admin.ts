import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiSuccess } from '@/lib/api';

export interface AdminTestRow {
  _id: string;
  title: string;
  examSlug: string;
  type: string;
  status: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  examId?: { name: string; slug: string };
  createdAt?: string;
}

export interface AdminQuestionRow {
  _id: string;
  text: string;
  type: string;
  difficulty: string;
  marks: number;
  options: { id: string; text: string }[];
  correctAnswer: string;
  examCategoryId?: { name: string; slug: string };
  createdAt?: string;
}

export function useAdminAllTests(examSlug?: string, status?: string) {
  return useQuery({
    queryKey: ['admin-all-tests', examSlug, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (examSlug) params.set('examSlug', examSlug);
      if (status) params.set('status', status);
      params.set('limit', '50');
      const q = params.toString() ? `?${params}` : '';
      return api<ApiSuccess<AdminTestRow[]>>(`/admin/exam-management/tests${q}`).then((r) => r.data);
    },
  });
}

export function useAdminQuestions(examId?: string) {
  return useQuery({
    queryKey: ['admin-questions', examId],
    queryFn: () => {
      const q = examId ? `?examId=${examId}&limit=50` : '?limit=50';
      return api<ApiSuccess<AdminQuestionRow[]>>(`/admin/questions${q}`).then((r) => r.data);
    },
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/admin/questions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-questions'] }),
  });
}

export function useCloneTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) =>
      api(`/admin/tests/${testId}/clone`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-all-tests'] }),
  });
}
