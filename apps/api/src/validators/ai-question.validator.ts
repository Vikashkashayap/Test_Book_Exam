import { z } from 'zod';

export const listQuestionBankSchema = z.object({
  examId: z.string().optional(),
  examSlug: z.string().optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
