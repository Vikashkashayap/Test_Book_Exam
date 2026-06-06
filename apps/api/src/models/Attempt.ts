import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAnswerRecord {
  questionId: Types.ObjectId;
  answer: string | string[] | number | null;
  status: 'answered' | 'not_answered' | 'marked_for_review' | 'answered_marked';
  timeSpentSeconds: number;
  isCorrect?: boolean;
  marksObtained?: number;
  visitedAt?: Date;
}

export interface IAttempt extends Document {
  userId: Types.ObjectId;
  testId: Types.ObjectId;
  answers: IAnswerRecord[];
  startedAt: Date;
  submittedAt?: Date;
  expiresAt: Date;
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'abandoned';
  currentQuestionIndex: number;
  timeRemainingSeconds: number;
  isFullScreen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttemptSchema = new Schema<IAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
        answer: Schema.Types.Mixed,
        status: {
          type: String,
          enum: ['answered', 'not_answered', 'marked_for_review', 'answered_marked'],
          default: 'not_answered',
        },
        timeSpentSeconds: { type: Number, default: 0 },
        isCorrect: Boolean,
        marksObtained: Number,
        visitedAt: Date,
      },
    ],
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'auto_submitted', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
    currentQuestionIndex: { type: Number, default: 0 },
    timeRemainingSeconds: Number,
    isFullScreen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AttemptSchema.index({ userId: 1, testId: 1 });
AttemptSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const Attempt = mongoose.model<IAttempt>('Attempt', AttemptSchema);
