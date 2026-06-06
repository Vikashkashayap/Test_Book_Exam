import mongoose, { Schema, Document, Types } from 'mongoose';

export type AITestStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IAITest extends Document {
  batchId: string;
  examId: Types.ObjectId;
  examSlug: string;
  examCategoryId: Types.ObjectId;
  categorySlug: string;
  subjectIds: Types.ObjectId[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  requestedQuestions: number;
  generatedQuestions: number;
  testId?: Types.ObjectId;
  questionIds: Types.ObjectId[];
  title: string;
  durationMinutes: number;
  aiModel: string;
  subjectNames: string[];
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
  progress: number;
  status: AITestStatus;
  error?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AITestSchema = new Schema<IAITest>(
  {
    batchId: { type: String, required: true, unique: true, index: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    examSlug: { type: String, required: true, index: true },
    examCategoryId: { type: Schema.Types.ObjectId, ref: 'ExamCategory', required: true },
    categorySlug: { type: String, required: true },
    subjectIds: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], required: true },
    requestedQuestions: { type: Number, required: true },
    generatedQuestions: { type: Number, default: 0 },
    testId: { type: Schema.Types.ObjectId, ref: 'Test' },
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    title: { type: String, required: true },
    durationMinutes: { type: Number, default: 60 },
    aiModel: { type: String, default: 'google/gemini-2.5-flash-lite' },
    subjectNames: [String],
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      estimatedCostUsd: { type: Number, default: 0 },
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    error: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const AITest = mongoose.model<IAITest>('AITest', AITestSchema);
