import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Bookmark } from '../models/Bookmark';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

export const listBookmarks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 12 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const filter = { userId: req.user!.id };

  const [bookmarks, total] = await Promise.all([
    Bookmark.find(filter)
      .populate('questionId', 'text type subjectId topicId')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Bookmark.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: bookmarks,
    meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  });
});

export const addBookmark = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { questionId, testId, note, tags } = req.body;
  const bookmark = await Bookmark.findOneAndUpdate(
    { userId: req.user!.id, questionId },
    { note, tags, testId },
    { upsert: true, new: true }
  );
  res.json({ success: true, data: bookmark });
});

export const removeBookmark = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Bookmark.findOneAndDelete({ userId: req.user!.id, questionId: req.params.questionId });
  res.json({ success: true, message: 'Bookmark removed' });
});

export const updateBookmarkNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const bookmark = await Bookmark.findOneAndUpdate(
    { userId: req.user!.id, questionId: req.params.questionId },
    { note: req.body.note },
    { new: true }
  );
  if (!bookmark) throw new ApiError(404, 'Bookmark not found');
  res.json({ success: true, data: bookmark });
});
