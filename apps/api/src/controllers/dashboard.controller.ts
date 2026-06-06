import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Result } from '../models/Result';
import { Attempt } from '../models/Attempt';
import { asyncHandler } from '../utils/asyncHandler';

export const getStudentDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const results = await Result.find({ userId }).lean();
  const testsAttempted = results.length;
  const avgScore =
    testsAttempted > 0
      ? results.reduce((s, r) => s + r.percentage, 0) / testsAttempted
      : 0;
  const avgAccuracy =
    testsAttempted > 0
      ? results.reduce((s, r) => s + r.accuracy, 0) / testsAttempted
      : 0;

  const globalRankAgg = await Result.aggregate([
    { $group: { _id: '$userId', totalScore: { $sum: '$score' } } },
    { $sort: { totalScore: -1 } },
  ]);
  const rankIndex = globalRankAgg.findIndex((r) => r._id.toString() === userId);
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;

  const subjectMap = new Map<string, { name: string; correct: number; total: number }>();
  for (const r of results) {
    for (const s of r.subjectAnalysis) {
      const key = s.subjectId.toString();
      const existing = subjectMap.get(key) ?? {
        name: s.subjectName,
        correct: 0,
        total: 0,
      };
      existing.correct += s.correct;
      existing.total += s.total;
      subjectMap.set(key, existing);
    }
  }

  const subjects = Array.from(subjectMap.values()).map((s) => ({
    name: s.name,
    accuracy: s.total > 0 ? (s.correct / s.total) * 100 : 0,
  }));

  subjects.sort((a, b) => b.accuracy - a.accuracy);
  const strongSubjects = subjects.filter((s) => s.accuracy >= 70).slice(0, 3);
  const weakSubjects = subjects.filter((s) => s.accuracy < 60).slice(-3).reverse();

  const timeAnalysis = results.slice(-10).map((r) => ({
    testId: r.testId,
    minutes: Math.round(r.totalTimeSeconds / 60),
    date: r.createdAt,
  }));

  const latestAI = results.find((r) => r.aiAnalysis)?.aiAnalysis;

  const inProgress = await Attempt.countDocuments({ userId, status: 'in_progress' });

  res.json({
    success: true,
    data: {
      stats: {
        testsAttempted,
        averageScore: Math.round(avgScore * 10) / 10,
        rank,
        accuracy: Math.round(avgAccuracy * 10) / 10,
        inProgressTests: inProgress,
      },
      strongSubjects,
      weakSubjects,
      timeAnalysis,
      aiRecommendation: latestAI
        ? {
            strengths: latestAI.strengths?.slice(0, 2),
            focusAreas: latestAI.improvementAreas?.slice(0, 2),
            suggestedTests: latestAI.suggestedTests,
          }
        : {
            message: 'Complete a test to unlock AI recommendations',
          },
      recentResults: results.slice(0, 5),
    },
  });
});
