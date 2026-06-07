import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const createTestFromBankSchema = z
  .object({
    examId: z.string().optional(),
    subjects: z.array(z.string().min(1)).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).optional(),
    questionCount: z.number().int().min(5).max(300).optional(),
    durationMinutes: z.number().int().min(0).max(360).optional(),
    title: z.string().min(3).max(200).optional(),
    mockType: z
      .enum(['subject_based', 'full_length', 'practice_set', 'subject_test', 'pyq'])
      .default('full_length'),
    avoidReuse: z.boolean().default(true),
    autoGenerate: z.boolean().default(true),
    scheduledAt: z.string().datetime().optional(),
    year: z.number().int().min(currentYear - 15).max(currentYear).optional(),
    generateAllYears: z.boolean().default(false),
    generateAllExams: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.generateAllExams && !data.examId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'examId is required',
        path: ['examId'],
      });
    }
    if (data.mockType === 'pyq' && !data.generateAllYears && !data.year) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'year is required for PYQ generation',
        path: ['year'],
      });
    }
  });

export const examPatternQuerySchema = z.object({
  examId: z.string().min(1),
  mockType: z
    .enum(['subject_based', 'full_length', 'practice_set', 'subject_test', 'pyq'])
    .default('full_length'),
  subject: z.string().optional(),
});
