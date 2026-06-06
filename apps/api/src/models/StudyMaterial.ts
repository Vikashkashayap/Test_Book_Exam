import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStudyMaterial extends Document {
  title: string;
  slug: string;
  type: 'pdf_notes' | 'previous_year_pdf' | 'practice_sheet' | 'magazine' | 'video';
  description?: string;
  fileUrl: string;
  cloudinaryPublicId?: string;
  thumbnailUrl?: string;
  examId: Types.ObjectId;
  examSlug: string;
  examSlugs: string[];
  examCategoryId: Types.ObjectId;
  categorySlug: string;
  subjectId?: Types.ObjectId;
  year?: number;
  requiredPlan: 'free' | 'silver' | 'gold' | 'premium';
  downloadCount: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StudyMaterialSchema = new Schema<IStudyMaterial>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    type: {
      type: String,
      enum: ['pdf_notes', 'previous_year_pdf', 'practice_sheet', 'magazine', 'video'],
      required: true,
      index: true,
    },
    description: String,
    fileUrl: { type: String, required: true },
    cloudinaryPublicId: String,
    thumbnailUrl: String,
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    examSlug: { type: String, required: true, index: true },
    examSlugs: [{ type: String, index: true }],
    examCategoryId: { type: Schema.Types.ObjectId, ref: 'ExamCategory', required: true },
    categorySlug: { type: String, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    year: Number,
    requiredPlan: {
      type: String,
      enum: ['free', 'silver', 'gold', 'premium'],
      default: 'free',
    },
    downloadCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

StudyMaterialSchema.index({ examSlug: 1, type: 1 });

export const StudyMaterial = mongoose.model<IStudyMaterial>('StudyMaterial', StudyMaterialSchema);
