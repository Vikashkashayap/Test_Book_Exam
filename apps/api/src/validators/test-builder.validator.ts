import { z } from 'zod';

export const createTestFromBankSchema = z.object({
  examId: z.string().min(1, 'examId is required'),
  subjects: z.array(z.string().min(1)).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).optional(),
  questionCount: z.number().int().min(5).max(300).optional(),
  durationMinutes: z.number().int().min(0).max(360).optional(),
  title: z.string().min(3).max(200).optional(),
  mockType: z.enum(['subject_based', 'full_length', 'practice_set', 'subject_test']).default('full_length'),
  avoidReuse: z.boolean().default(true),
  autoGenerate: z.boolean().default(true),
  scheduledAt: z.string().datetime().optional(),
});

export const examPatternQuerySchema = z.object({
  examId: z.string().min(1),
  mockType: z.enum(['subject_based', 'full_length', 'practice_set', 'subject_test']).default('full_length'),
  subject: z.string().optional(),
});
