import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuestionBankEntry extends Document {
  exam: string;
  examSlug: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  questionHi?: string;
  options: string[];
  optionsHi?: string[];
  correctAnswer: string;
  explanation: string;
  explanationHi?: string;
  source: 'ai' | 'pdf' | 'manual' | 'import';
  aiModel?: string;
  generatedBy: Types.ObjectId;
  questionHash: string;
  lastUsedInTest?: Types.ObjectId;
  lastUsedAt?: Date;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionBankEntrySchema = new Schema<IQuestionBankEntry>(
  {
    exam: { type: String, required: true, index: true },
    examSlug: { type: String, required: true, index: true },
    subject: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, index: true },
    question: { type: String, required: true },
    questionHi: String,
    options: [{ type: String }],
    optionsHi: [{ type: String }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    explanationHi: String,
    source: { type: String, enum: ['ai', 'pdf', 'manual', 'import'], default: 'ai', index: true },
    aiModel: String,
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionHash: { type: String, required: true, index: true },
    lastUsedInTest: { type: Schema.Types.ObjectId, ref: 'Test', index: true },
    lastUsedAt: Date,
    generatedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, collection: 'question_bank' }
);

QuestionBankEntrySchema.index({ examSlug: 1, questionHash: 1 }, { unique: true });
QuestionBankEntrySchema.index({ examSlug: 1, subject: 1, topic: 1, difficulty: 1 });
QuestionBankEntrySchema.index({ examSlug: 1, subject: 1, difficulty: 1 });

export const QuestionBankEntry = mongoose.model<IQuestionBankEntry>(
  'QuestionBankEntry',
  QuestionBankEntrySchema
);
