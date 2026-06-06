import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICurrentAffair extends Document {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  category: string;
  period?: 'daily' | 'weekly' | 'monthly';
  examId?: Types.ObjectId;
  examSlug?: string;
  examSlugs?: string[];
  examCategoryIds: Types.ObjectId[];
  imageUrl?: string;
  source?: string;
  publishedDate: Date;
  tags: string[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CurrentAffairSchema = new Schema<ICurrentAffair>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, required: true },
    summary: String,
    category: { type: String, required: true, index: true },
    period: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', index: true },
    examSlug: { type: String, index: true },
    examSlugs: [{ type: String, index: true }],
    examCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'ExamCategory' }],
    imageUrl: String,
    source: String,
    publishedDate: { type: Date, required: true, index: true },
    tags: [String],
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

CurrentAffairSchema.index({ examSlug: 1, publishedDate: -1 });

export const CurrentAffair = mongoose.model<ICurrentAffair>('CurrentAffair', CurrentAffairSchema);
