import { z } from 'zod';

export const generateQuestionsSchema = z.object({
  categoryId: z.string().min(1, 'Category is required').optional(),
  examId: z.string().min(1, 'Exam is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  topicId: z.string().min(1, 'Topic is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.coerce.number().int().min(1).max(25),
});

export const generateTestSchema = z.object({
  examId: z.string().min(1, 'Exam is required'),
  subjectIds: z.array(z.string().min(1)).min(1, 'Select at least one subject'),
  totalQuestions: z.coerce.number().int().min(5).max(500),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']),
  title: z.string().optional(),
  scheduleAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  aiModel: z.string().optional(),
});

export const pdfExtractSchema = z.object({
  categoryId: z.string().min(1).optional(),
  examId: z.string().min(1),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  maxQuestions: z.coerce.number().int().min(1).max(50).optional(),
});
