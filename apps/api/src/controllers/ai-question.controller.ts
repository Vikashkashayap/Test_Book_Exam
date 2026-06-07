import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { listQuestionBank, getQuestionBankStats } from '../services/ai-question.service';
import { listQuestionBankSchema } from '../validators/ai-question.validator';

export const getQuestionBank = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = listQuestionBankSchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }

  const result = await listQuestionBank(parsed.data);

  res.json({
    success: true,
    data: result.entries,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
      stats: result.stats,
    },
  });
});

export const getQuestionBankAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examSlug } = req.query;
  const stats = await getQuestionBankStats(
    typeof examSlug === 'string' ? examSlug : undefined
  );

  res.json({ success: true, data: stats });
});
