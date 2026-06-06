import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Feedback, FeedbackStatus } from '../models/Feedback';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const VALID_CATEGORIES = ['bug', 'improvement', 'feature', 'other'] as const;
const VALID_STATUSES: FeedbackStatus[] = ['new', 'reviewed', 'resolved'];

export const submitFeedback = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category, subject, message, pageUrl } = req.body;

  if (!category || !VALID_CATEGORIES.includes(category)) {
    throw new ApiError(400, 'Invalid feedback category');
  }
  if (!subject?.trim()) {
    throw new ApiError(400, 'Subject is required');
  }
  if (!message?.trim() || message.trim().length < 10) {
    throw new ApiError(400, 'Message must be at least 10 characters');
  }

  const feedback = await Feedback.create({
    userId: req.user!.id,
    category,
    subject: subject.trim(),
    message: message.trim(),
    pageUrl: pageUrl?.trim() || undefined,
  });

  res.status(201).json({ success: true, data: feedback });
});

export const listMyFeedback = asyncHandler(async (req: AuthRequest, res: Response) => {
  const feedback = await Feedback.find({ userId: req.user!.id })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: feedback });
});

export const listAllFeedback = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter: Record<string, unknown> = {};
  if (status && VALID_STATUSES.includes(status as FeedbackStatus)) {
    filter.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Feedback.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Feedback.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const updateFeedbackStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, adminNote } = req.body;
  const update: Record<string, unknown> = {};

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      throw new ApiError(400, 'Invalid status');
    }
    update.status = status;
  }
  if (adminNote !== undefined) {
    update.adminNote = adminNote?.trim() || undefined;
  }

  if (Object.keys(update).length === 0) {
    throw new ApiError(400, 'Nothing to update');
  }

  const feedback = await Feedback.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate('userId', 'name email phone')
    .lean();

  if (!feedback) {
    throw new ApiError(404, 'Feedback not found');
  }

  res.json({ success: true, data: feedback });
});

export const getFeedbackStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [newCount, reviewedCount, resolvedCount, total] = await Promise.all([
    Feedback.countDocuments({ status: 'new' }),
    Feedback.countDocuments({ status: 'reviewed' }),
    Feedback.countDocuments({ status: 'resolved' }),
    Feedback.countDocuments(),
  ]);

  res.json({
    success: true,
    data: { new: newCount, reviewed: reviewedCount, resolved: resolvedCount, total },
  });
});
