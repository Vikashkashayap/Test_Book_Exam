import type {
  USER_ROLES,
  SUBSCRIPTION_PLANS,
  QUESTION_TYPES,
  TEST_TYPES,
  NOTIFICATION_CHANNELS,
  AI_FEATURES,
} from './constants';

export type UserRole = (typeof USER_ROLES)[number];
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];
export type QuestionType = (typeof QUESTION_TYPES)[number];
export type TestType = (typeof TEST_TYPES)[number];
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type AIFeature = (typeof AI_FEATURES)[number];

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

export interface OnboardingPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  categorySlugs: string[];
  examSlugs: string[];
}

export interface PersonalizedDashboardSection {
  title: string;
  type: 'tests' | 'pyq' | 'current_affairs' | 'notes' | 'videos' | 'quiz';
  items: unknown[];
  href: string;
}
