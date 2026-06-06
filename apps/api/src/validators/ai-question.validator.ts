import { z } from 'zod';

export const ALLOWED_QUESTION_COUNTS = [5, 8, 10, 20, 25, 30] as const;

export const generateAiQuestionsSchema = z.object({
  examId: z.string().min(1, 'examId is required'),
  subject: z.string().min(1, 'subject is required'),
  topic: z.string().min(1, 'topic is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionCount: z.union([
    z.literal(5),
    z.literal(8),
    z.literal(10),
    z.literal(20),
    z.literal(25),
    z.literal(30),
  ]),
  aiModel: z.string().optional(),
});

export const listQuestionBankSchema = z.object({
  examId: z.string().optional(),
  examSlug: z.string().optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
