import mongoose, { Schema, Document, Types } from 'mongoose';

export type AIGenerationSource = 'gemini' | 'pdf_extraction';
export type AIGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IAIGeneratedQuestion extends Document {
  batchId: string;
  categoryId: Types.ObjectId;
  categorySlug: string;
  examId: Types.ObjectId;
  examSlug: string;
  subjectId: Types.ObjectId;
  topicId: Types.ObjectId;
  difficulty: 'easy' | 'medium' | 'hard';
  requestedCount: number;
  generatedCount: number;
  questionIds: Types.ObjectId[];
  questionBankId?: Types.ObjectId;
  source: AIGenerationSource;
  pdfUrl?: string;
  pdfFilename?: string;
  aiModel: string;
  status: AIGenerationStatus;
  error?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AIGeneratedQuestionSchema = new Schema<IAIGeneratedQuestion>(
  {
    batchId: { type: String, required: true, unique: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExamCategory', required: true, index: true },
    categorySlug: { type: String, required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    examSlug: { type: String, required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    requestedCount: { type: Number, required: true },
    generatedCount: { type: Number, default: 0 },
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    questionBankId: { type: Schema.Types.ObjectId, ref: 'QuestionBank' },
    source: { type: String, enum: ['gemini', 'pdf_extraction'], default: 'gemini' },
    pdfUrl: String,
    pdfFilename: String,
    aiModel: { type: String, default: 'gemini-2.5-flash' },
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

export const AIGeneratedQuestion = mongoose.model<IAIGeneratedQuestion>(
  'AIGeneratedQuestion',
  AIGeneratedQuestionSchema
);
