import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuestionBank extends Document {
  name: string;
  description?: string;
  examCategoryId: Types.ObjectId;
  subjectId?: Types.ObjectId;
  questionIds: Types.ObjectId[];
  totalQuestions: number;
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionBankSchema = new Schema<IQuestionBank>(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    examCategoryId: { type: Schema.Types.ObjectId, ref: 'ExamCategory', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    totalQuestions: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const QuestionBank = mongoose.model<IQuestionBank>('QuestionBank', QuestionBankSchema);
