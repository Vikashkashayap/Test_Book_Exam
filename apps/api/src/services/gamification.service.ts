import { User } from '../models/User';
import { Achievement } from '../models/Achievement';
import { Notification } from '../models/Notification';
import { Result } from '../models/Result';

export async function awardPoints(userId: string, points: number): Promise<void> {
  await User.findByIdAndUpdate(userId, { $inc: { points } });
}

export async function updateStreak(userId: string): Promise<number> {
  const user = await User.findById(userId);
  if (!user) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = new Date(user.lastActiveAt);
  lastActive.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

  let newStreak = user.streak;
  if (diffDays === 0) {
    return newStreak;
  } else if (diffDays === 1) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  user.streak = newStreak;
  user.lastActiveAt = new Date();
  await user.save();

  await checkAchievements(userId);
  return newStreak;
}

export async function checkAchievements(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  const achievements = await Achievement.find({ isActive: true });
  const testsCompleted = await Result.countDocuments({ userId });

  for (const achievement of achievements) {
    if (user.achievements.some((a) => a.toString() === achievement._id.toString())) continue;

    let earned = false;
    const { type, threshold } = achievement.criteria;

    switch (type) {
      case 'tests_completed':
        earned = testsCompleted >= threshold;
        break;
      case 'streak':
        earned = user.streak >= threshold;
        break;
      case 'accuracy': {
        const avg = await Result.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: null, avg: { $avg: '$accuracy' } } },
        ]);
        earned = (avg[0]?.avg ?? 0) >= threshold;
        break;
      }
      default:
        break;
    }

    if (earned) {
      user.achievements.push(achievement._id);
      user.badges.push(achievement.code);
      user.points += achievement.points;
      await Notification.create({
        userId: user._id,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You earned "${achievement.name}" (+${achievement.points} points)`,
      });
    }
  }

  await user.save();
}
