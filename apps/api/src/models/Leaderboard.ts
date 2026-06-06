import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILeaderboardEntry {
  userId: Types.ObjectId;
  userName: string;
  avatar?: string;
  score: number;
  testsAttempted: number;
  accuracy: number;
  rank: number;
}

export interface ILeaderboard extends Document {
  type: 'global' | 'weekly' | 'monthly' | 'test';
  testId?: Types.ObjectId;
  examCategoryId?: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  entries: ILeaderboardEntry[];
  lastUpdatedAt: Date;
  createdAt: Date;
}

const LeaderboardSchema = new Schema<ILeaderboard>(
  {
    type: {
      type: String,
      enum: ['global', 'weekly', 'monthly', 'test'],
      required: true,
      index: true,
    },
    testId: { type: Schema.Types.ObjectId, ref: 'Test' },
    examCategoryId: { type: Schema.Types.ObjectId, ref: 'ExamCategory' },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    entries: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        userName: String,
        avatar: String,
        score: Number,
        testsAttempted: Number,
        accuracy: Number,
        rank: Number,
      },
    ],
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

LeaderboardSchema.index({ type: 1, periodStart: -1 });

export const Leaderboard = mongoose.model<ILeaderboard>('Leaderboard', LeaderboardSchema);
