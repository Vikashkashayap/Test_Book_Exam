import mongoose, { Schema, Document } from 'mongoose';

export interface IExamCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  group: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExamCategorySchema = new Schema<IExamCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    icon: String,
    group: { type: String, required: true, index: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ExamCategory = mongoose.model<IExamCategory>('ExamCategory', ExamCategorySchema);
