import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Result } from '../models/Result';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';

export const getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type = 'global' } = req.query;

  let dateFilter: Record<string, Date> = {};
  const now = new Date();

  if (type === 'weekly') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    dateFilter = { $gte: weekAgo };
  } else if (type === 'monthly') {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    dateFilter = { $gte: monthAgo };
  }

  const matchStage: Record<string, unknown> = {};
  if (Object.keys(dateFilter).length) matchStage.createdAt = dateFilter;

  const entries = await Result.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$userId',
        totalScore: { $sum: '$score' },
        testsAttempted: { $sum: 1 },
        avgAccuracy: { $avg: '$accuracy' },
      },
    },
    { $sort: { totalScore: -1 } },
    { $limit: 100 },
  ]);

  const userIds = entries.map((e) => e._id);
  const users = await User.find({ _id: { $in: userIds } }).select('name avatar points').lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const leaderboard = entries.map((e, i) => {
    const user = userMap.get(e._id.toString());
    return {
      rank: i + 1,
      userId: e._id,
      userName: user?.name ?? 'Anonymous',
      avatar: user?.avatar,
      score: e.totalScore,
      testsAttempted: e.testsAttempted,
      accuracy: Math.round(e.avgAccuracy * 10) / 10,
      points: user?.points ?? 0,
    };
  });

  const myRank = leaderboard.findIndex((e) => e.userId.toString() === req.user?.id) + 1;

  res.json({
    success: true,
    data: { entries: leaderboard, myRank: myRank || null, type },
  });
});
