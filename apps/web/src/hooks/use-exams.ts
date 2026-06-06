import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiSuccess } from '@/lib/api';

export interface ExamGroup {
  name: string;
  slug: string;
  icon: string;
  exams: { name: string; slug: string; _id?: string }[];
}

export interface PersonalizedDashboard {
  exams: { name: string; slug: string; categorySlug: string }[];
  sections: {
    examSlug: string;
    examName: string;
    title: string;
    type: string;
    href: string;
    items: unknown[];
  }[];
  needsOnboarding?: boolean;
  primaryExam?: string;
}

export function useExamEcosystem() {
  return useQuery({
    queryKey: ['exam-ecosystem'],
    queryFn: () => api<ApiSuccess<ExamGroup[]>>('/exams/ecosystem').then((r) => r.data),
  });
}

export function usePersonalizedDashboard() {
  return useQuery({
    queryKey: ['personalized-dashboard'],
    queryFn: () =>
      api<ApiSuccess<PersonalizedDashboard>>('/exams/dashboard/personalized').then((r) => r.data),
  });
}

export function useUpdateSelectedExams() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examSlugs: string[]) =>
      api('/exams/selected', {
        method: 'PATCH',
        body: JSON.stringify({ examSlugs }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personalized-dashboard'] });
    },
  });
}
