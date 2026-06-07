'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiSuccess, uploadPdf } from '@/lib/api';

export interface AdminPyqPdfRow {
  _id: string;
  title: string;
  year?: number;
  fileUrl: string;
  description?: string;
  isActive: boolean;
  examSlug: string;
  examId?: { name: string; slug: string };
  createdAt?: string;
}

export interface AdminBlogRow {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  imageUrl?: string;
  author?: string;
  category?: string;
  isPublished: boolean;
  showOnHomepage: boolean;
  publishedAt?: string;
  createdAt?: string;
}

export function useAdminPyqPdfs() {
  return useQuery({
    queryKey: ['admin-pyq-pdfs'],
    queryFn: () =>
      api<ApiSuccess<AdminPyqPdfRow[]>>(
        '/admin/exam-management/materials?type=previous_year_pdf'
      ).then((r) => r.data),
  });
}

export function useUploadPyqPdf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/admin/exam-management/materials', {
        method: 'POST',
        body: JSON.stringify({ ...body, type: 'previous_year_pdf' }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pyq-pdfs'] });
      qc.invalidateQueries({ queryKey: ['public-pyq'] });
    },
  });
}

export function useUpdatePyqPdf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      api(`/admin/exam-management/materials/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pyq-pdfs'] });
      qc.invalidateQueries({ queryKey: ['public-pyq'] });
    },
  });
}

export function useDeletePyqPdf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/admin/exam-management/materials/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pyq-pdfs'] });
      qc.invalidateQueries({ queryKey: ['public-pyq'] });
    },
  });
}

export async function uploadPyqPdfFile(file: File): Promise<string> {
  return uploadPdf(file);
}

export function useAdminBlogs() {
  return useQuery({
    queryKey: ['admin-blogs'],
    queryFn: () =>
      api<ApiSuccess<AdminBlogRow[]>>('/admin/exam-management/blogs').then((r) => r.data),
  });
}

export function useCreateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/admin/exam-management/blogs', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blogs'] });
      qc.invalidateQueries({ queryKey: ['public-blogs'] });
    },
  });
}

export function useUpdateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      api(`/admin/exam-management/blogs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blogs'] });
      qc.invalidateQueries({ queryKey: ['public-blogs'] });
    },
  });
}

export function usePublishBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, showOnHomepage }: { id: string; showOnHomepage?: boolean }) =>
      api(`/admin/exam-management/blogs/${id}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ showOnHomepage }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blogs'] });
      qc.invalidateQueries({ queryKey: ['public-blogs'] });
    },
  });
}
