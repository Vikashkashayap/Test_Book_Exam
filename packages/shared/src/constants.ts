export const APP_NAME = 'MentorsDaily ExamPrep Pro';

export const USER_ROLES = ['student', 'instructor', 'admin', 'super_admin'] as const;

export const SUBSCRIPTION_PLANS = ['free', 'silver', 'gold', 'premium', 'enterprise'] as const;

export const QUESTION_TYPES = [
  'single_mcq',
  'multiple_mcq',
  'numerical',
  'true_false',
  'match_following',
  'assertion_reason',
  'paragraph',
  'image_based',
] as const;

export const TEST_TYPES = [
  'full_length',
  'sectional',
  'topic_wise',
  'daily_quiz',
  'practice_set',
  'previous_year',
  'custom',
] as const;

export const NOTIFICATION_CHANNELS = ['email', 'whatsapp', 'push', 'in_app'] as const;

export const PLAN_FEATURES: Record<string, string[]> = {
  free: ['5 mock tests/month', 'Basic analytics', 'Daily quiz', 'Limited CA'],
  silver: ['50 mock tests/month', 'PDF notes', 'Weekly leaderboard', 'Email alerts'],
  gold: ['Unlimited mocks', 'AI analysis', 'All study materials', 'WhatsApp alerts'],
  premium: ['Everything in Gold', 'AI mentor', 'Live rankings', 'Priority support'],
  enterprise: ['Institute dashboard', 'Bulk students', 'Custom tests', 'Dedicated support'],
};

export const PLAN_PRICES_INR: Record<string, number> = {
  free: 0,
  silver: 299,
  gold: 599,
  premium: 999,
  enterprise: 4999,
};

export const AI_FEATURES = [
  'ai_mentor',
  'ai_study_planner',
  'ai_doubt_solver',
  'ai_question_explanation',
  'ai_performance_analysis',
  'ai_revision_planner',
  'ai_daily_targets',
  'ai_motivation',
] as const;
