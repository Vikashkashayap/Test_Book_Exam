import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubjectAnalysis {
  subjectId: Types.ObjectId;
  subjectName: string;
  total: number;
  correct: number;
  wrong: number;
  unattempted: number;
  accuracy: number;
  timeSpentSeconds: number;
}

export interface ITopicAnalysis {
  topicId: Types.ObjectId;
  topicName: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface IAIAnalysis {
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
  studyPlan: string[];
  suggestedTests: Types.ObjectId[];
  suggestedTopics: Types.ObjectId[];
  generatedAt: Date;
}

export interface IResult extends Document {
  userId: Types.ObjectId;
  testId: Types.ObjectId;
  attemptId: Types.ObjectId;
  score: number;
  maxScore: number;
  percentage: number;
  rank?: number;
  percentile?: number;
  totalParticipants?: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  accuracy: number;
  totalTimeSeconds: number;
  subjectAnalysis: ISubjectAnalysis[];
  topicAnalysis: ITopicAnalysis[];
  aiAnalysis?: IAIAnalysis;
  createdAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'Attempt', required: true, unique: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, required: true, index: true },
    rank: Number,
    percentile: Number,
    totalParticipants: Number,
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    unattemptedCount: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    totalTimeSeconds: { type: Number, default: 0 },
    subjectAnalysis: [
      {
        subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
        subjectName: String,
        total: Number,
        correct: Number,
        wrong: Number,
        unattempted: Number,
        accuracy: Number,
        timeSpentSeconds: Number,
      },
    ],
    topicAnalysis: [
      {
        topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
        topicName: String,
        total: Number,
        correct: Number,
        accuracy: Number,
      },
    ],
    aiAnalysis: {
      strengths: [String],
      weaknesses: [String],
      improvementAreas: [String],
      studyPlan: [String],
      suggestedTests: [{ type: Schema.Types.ObjectId, ref: 'Test' }],
      suggestedTopics: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
      generatedAt: Date,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ResultSchema.index({ testId: 1, score: -1 });
ResultSchema.index({ userId: 1, createdAt: -1 });

export const Result = mongoose.model<IResult>('Result', ResultSchema);
