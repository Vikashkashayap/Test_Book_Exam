import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAIGenerationLog extends Document {
  type: 'question_generation' | 'test_build';
  examSlug: string;
  subject?: string;
  topic?: string;
  questionsGenerated: number;
  questionsSaved: number;
  duplicatesRemoved: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
  aiModel?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AIGenerationLogSchema = new Schema<IAIGenerationLog>(
  {
    type: {
      type: String,
      enum: ['question_generation', 'test_build'],
      required: true,
      index: true,
    },
    examSlug: { type: String, required: true, index: true },
    subject: String,
    topic: String,
    questionsGenerated: { type: Number, default: 0 },
    questionsSaved: { type: Number, default: 0 },
    duplicatesRemoved: { type: Number, default: 0 },
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      estimatedCostUsd: { type: Number, default: 0 },
    },
    aiModel: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

AIGenerationLogSchema.index({ createdBy: 1, createdAt: -1 });
AIGenerationLogSchema.index({ examSlug: 1, createdAt: -1 });

export const AIGenerationLog = mongoose.model<IAIGenerationLog>(
  'AIGenerationLog',
  AIGenerationLogSchema
);
