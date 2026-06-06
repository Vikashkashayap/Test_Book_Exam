import { z } from 'zod';

export const generateAiTestSchema = z.object({
  examId: z.string().min(1, 'examId is required'),
  subjects: z.array(z.string().min(1)).min(1, 'Select at least one subject'),
  totalQuestions: z.union([
    z.literal(20),
    z.literal(50),
    z.literal(100),
    z.literal(200),
  ]),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']),
  title: z.string().optional(),
  aiModel: z.string().optional(),
});

export const publishAiTestSchema = z.object({
  testId: z.string().min(1, 'testId is required'),
  batchId: z.string().optional(),
});
