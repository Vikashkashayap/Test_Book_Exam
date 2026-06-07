import { useQuery } from '@tanstack/react-query';
import { api, ApiSuccess } from '@/lib/api';

export interface PublicPyqPaper {
  id: string;
  title: string;
  exam: string;
  examSlug: string;
  categorySlug: string;
  year: number | null;
  fileUrl: string;
  description: string;
}

export interface PublicPyqYearGroup {
  year: number | null;
  papers: PublicPyqPaper[];
}

export interface PublicPyqResponse {
  years: PublicPyqYearGroup[];
  total: number;
}

export interface PublicBlogItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  imageUrl: string | null;
  author: string;
  category: string;
  publishedAt: string;
}

export const PYQ_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'ssc', label: 'SSC' },
  { value: 'banking', label: 'Banking' },
  { value: 'railway', label: 'Railway' },
  { value: 'police', label: 'Police' },
  { value: 'upsc', label: 'UPSC' },
  { value: 'defence', label: 'Defence' },
  { value: 'teaching', label: 'Teaching' },
] as const;

export function usePublicPyq(category: string = 'all') {
  return useQuery({
    queryKey: ['public-pyq', category],
    queryFn: () => {
      const qs = category && category !== 'all' ? `?category=${category}` : '';
      return api<ApiSuccess<PublicPyqResponse>>(`/public/pyq${qs}`).then((r) => r.data);
    },
    staleTime: 60_000,
  });
}

export function usePublicBlogs() {
  return useQuery({
    queryKey: ['public-blogs'],
    queryFn: () => api<ApiSuccess<PublicBlogItem[]>>('/public/blogs').then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
