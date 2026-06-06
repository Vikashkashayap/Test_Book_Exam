import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiSuccess } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export interface SubjectItem {
  _id: string;
  name: string;
  slug: string;
}

export interface TopicItem {
  _id: string;
  name: string;
  slug: string;
}

export interface GeneratedQuestionItem {
  _id: string;
  text: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
}

export interface AIGenerationBatch {
  _id: string;
  batchId: string;
  examSlug: string;
  difficulty: string;
  requestedCount: number;
  generatedCount: number;
  status: string;
  source: string;
  createdAt: string;
  examId?: { name: string; slug: string };
  subjectId?: { name: string };
  topicId?: { name: string };
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
  createdAt: string;
  examId?: { name: string; slug: string };
  testId?: { title: string; slug: string; status: string; totalQuestions: number };
}

export function useAiGeneratorStatus() {
  return useQuery({
    queryKey: ['ai-generator-status'],
    queryFn: () =>
      api<ApiSuccess<{ geminiConfigured: boolean; model: string }>>('/admin/ai-generator/status').then(
        (r) => r.data
      ),
  });
}

export function useAiSubjects(examId?: string, categoryId?: string) {
  return useQuery({
    queryKey: ['ai-subjects', examId, categoryId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (examId) params.set('examId', examId);
      if (categoryId) params.set('categoryId', categoryId);
      return api<ApiSuccess<SubjectItem[]>>(`/admin/ai-generator/subjects?${params}`).then((r) => r.data);
    },
    enabled: Boolean(examId || categoryId),
  });
}

export function useAiTopics(subjectId?: string) {
  return useQuery({
    queryKey: ['ai-topics', subjectId],
    queryFn: () =>
      api<ApiSuccess<TopicItem[]>>(`/admin/ai-generator/topics?subjectId=${subjectId}`).then((r) => r.data),
    enabled: Boolean(subjectId),
  });
}

export function useCreateAiSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; examId: string }) =>
      api('/admin/ai-generator/subjects', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-subjects'] }),
  });
}

export function useCreateAiTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; subjectId: string }) =>
      api('/admin/ai-generator/topics', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-topics'] }),
  });
}

export function useGenerateAiQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      examId: string;
      subjectId: string;
      topicId: string;
      difficulty: 'easy' | 'medium' | 'hard';
      count: number;
      categoryId?: string;
    }) =>
      api<ApiSuccess<{ questions: GeneratedQuestionItem[]; batch: AIGenerationBatch }>>(
        '/admin/ai-generator/questions/generate',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-question-batches'] });
    },
  });
}

export function useAiQuestionBatches(examId?: string) {
  return useQuery({
    queryKey: ['ai-question-batches', examId],
    queryFn: () => {
      const q = examId ? `?examId=${examId}&limit=20` : '?limit=20';
      return api<ApiSuccess<AIGenerationBatch[]>>(`/admin/ai-generator/questions${q}`).then((r) => r.data);
    },
  });
}

export function useGenerateAiTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      examId: string;
      subjectIds: string[];
      totalQuestions: number;
      difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
      title?: string;
      scheduleAt?: string;
      endsAt?: string;
      aiModel?: string;
    }) =>
      api('/admin/ai-generator/tests/generate', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-test-batches'] });
    },
  });
}

export function useAiTestBatches(examId?: string) {
  return useQuery({
    queryKey: ['ai-test-batches', examId],
    queryFn: () => {
      const q = examId ? `?examId=${examId}&limit=20` : '?limit=20';
      return api<ApiSuccess<AITestBatch[]>>(`/admin/ai-generator/tests${q}`).then((r) => r.data);
    },
  });
}

export async function uploadPdfForExtraction(
  file: File,
  meta: {
    examId: string;
    categoryId?: string;
    subjectId?: string;
    topicId?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    maxQuestions?: number;
  }
) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const form = new FormData();
  form.append('file', file);
  form.append('examId', meta.examId);
  if (meta.categoryId) form.append('categoryId', meta.categoryId);
  if (meta.subjectId) form.append('subjectId', meta.subjectId);
  if (meta.topicId) form.append('topicId', meta.topicId);
  form.append('difficulty', meta.difficulty);
  if (meta.maxQuestions) form.append('maxQuestions', String(meta.maxQuestions));

  const res = await fetch(`${API_BASE}/api/v1/admin/ai-generator/questions/pdf-extract`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
    credentials: 'include',
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? json.message ?? 'PDF extraction failed');
  return json;
}
