import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  slug: string;
  examCategoryId: Types.ObjectId;
  icon?: string;
  order: number;
  isActive: boolean;
}

const SubjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    examCategoryId: { type: Schema.Types.ObjectId, ref: 'ExamCategory', required: true, index: true },
    icon: String,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SubjectSchema.index({ examCategoryId: 1, slug: 1 }, { unique: true });

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);
