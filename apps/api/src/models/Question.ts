import mongoose, { Schema, Document, Types } from 'mongoose';

export type QuestionTypeEnum =
  | 'single_mcq'
  | 'multiple_mcq'
  | 'numerical'
  | 'match_following'
  | 'assertion_reason'
  | 'paragraph';

export interface IQuestionOption {
  id: string;
  text: string;
  textHi?: string;
  isCorrect?: boolean;
}

export interface IQuestion extends Document {
  questionBankId?: Types.ObjectId;
  type: QuestionTypeEnum;
  text: string;
  textHi?: string;
  htmlContent?: string;
  options: IQuestionOption[];
  correctAnswer: string | string[] | number;
  explanation?: string;
  explanationHi?: string;
  paragraphId?: Types.ObjectId;
  matchPairs?: { left: string; right: string }[];
  assertion?: string;
  reason?: string;
  subjectId: Types.ObjectId;
  topicId: Types.ObjectId;
  examCategoryId: Types.ObjectId;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
  tags: string[];
  mediaUrl?: string;
  createdBy: Types.ObjectId;
  isActive: boolean;
  stats: {
    attempts: number;
    correct: number;
    avgTimeSeconds: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    questionBankId: { type: Schema.Types.ObjectId, ref: 'QuestionBank', index: true },
    type: {
      type: String,
      enum: ['single_mcq', 'multiple_mcq', 'numerical', 'match_following', 'assertion_reason', 'paragraph'],
      required: true,
    },
    text: { type: String, required: true },
    textHi: String,
    htmlContent: String,
    options: [
      {
        id: String,
        text: String,
        textHi: String,
        isCorrect: Boolean,
      },
    ],
    correctAnswer: Schema.Types.Mixed,
    explanation: String,
    explanationHi: String,
    paragraphId: { type: Schema.Types.ObjectId, ref: 'Question' },
    matchPairs: [{ left: String, right: String }],
    assertion: String,
    reason: String,
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    examCategoryId: { type: Schema.Types.ObjectId, ref: 'ExamCategory', required: true, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    tags: [String],
    mediaUrl: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    stats: {
      attempts: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      avgTimeSeconds: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

QuestionSchema.index({ subjectId: 1, topicId: 1, difficulty: 1 });
QuestionSchema.index({ tags: 1 });

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
