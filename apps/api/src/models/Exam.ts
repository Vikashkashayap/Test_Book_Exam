import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExam extends Document {
  name: string;
  slug: string;
  categoryId: Types.ObjectId;
  categorySlug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  order: number;
  meta?: {
    totalTests?: number;
    totalStudents?: number;
  };
}

const ExamSchema = new Schema<IExam>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExamCategory', required: true, index: true },
    categorySlug: { type: String, required: true, index: true },
    description: String,
    icon: String,
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    meta: {
      totalTests: { type: Number, default: 0 },
      totalStudents: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

ExamSchema.index({ categorySlug: 1, order: 1 });

export const Exam = mongoose.model<IExam>('Exam', ExamSchema);
