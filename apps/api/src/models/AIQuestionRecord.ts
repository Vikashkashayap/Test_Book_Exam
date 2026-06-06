import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAIQuestionRecord extends Document {
  exam: string;
  examSlug: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  questionHi?: string;
  options: { id: string; text: string; textHi?: string }[];
  correctAnswer: string;
  explanation: string;
  explanationHi?: string;
  questionHash: string;
  aiModel: string;
  generatedBy: Types.ObjectId;
  batchId?: string;
  testId?: Types.ObjectId;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIQuestionRecordSchema = new Schema<IAIQuestionRecord>(
  {
    exam: { type: String, required: true, index: true },
    examSlug: { type: String, required: true, index: true },
    subject: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    question: { type: String, required: true },
    questionHi: String,
    options: [
      {
        id: String,
        text: String,
        textHi: String,
      },
    ],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    explanationHi: String,
    questionHash: { type: String, required: true, index: true },
    aiModel: { type: String, required: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    batchId: { type: String, index: true },
    testId: { type: Schema.Types.ObjectId, ref: 'Test' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'ai_generated_questions' }
);

AIQuestionRecordSchema.index({ examSlug: 1, questionHash: 1 }, { unique: true });

export const AIQuestionRecord = mongoose.model<IAIQuestionRecord>(
  'AIQuestionRecord',
  AIQuestionRecordSchema
);
