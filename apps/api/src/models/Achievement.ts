import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  code: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  criteria: {
    type: 'tests_completed' | 'streak' | 'accuracy' | 'leaderboard_rank' | 'daily_challenge';
    threshold: number;
  };
  badgeColor: string;
  isActive: boolean;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    points: { type: Number, default: 10 },
    criteria: {
      type: {
        type: String,
        enum: ['tests_completed', 'streak', 'accuracy', 'leaderboard_rank', 'daily_challenge'],
        required: true,
      },
      threshold: { type: Number, required: true },
    },
    badgeColor: { type: String, default: '#6366f1' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema);
