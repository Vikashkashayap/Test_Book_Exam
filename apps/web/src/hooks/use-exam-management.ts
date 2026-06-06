import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiSuccess } from '@/lib/api';

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  examCount?: number;
}

export interface ExamItem {
  _id: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryId: { name: string; slug: string };
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin-categories'],
    queryFn: () =>
      api<ApiSuccess<CategoryItem[]>>('/admin/exam-management/categories').then((r) => r.data),
  });
}

export function useAdminExams(categorySlug?: string) {
  return useQuery({
    queryKey: ['admin-exams', categorySlug],
    queryFn: () => {
      const q = categorySlug ? `?categorySlug=${categorySlug}` : '';
      return api<ApiSuccess<ExamItem[]>>(`/admin/exam-management/exams${q}`).then((r) => r.data);
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; slug: string; icon?: string }) =>
      api('/admin/exam-management/categories', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; slug: string; categoryId?: string }) =>
      api('/admin/exam-management/exams', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-exams'] });
      qc.invalidateQueries({ queryKey: ['exam-ecosystem'] });
    },
  });
}
