import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITopic extends Document {
  name: string;
  slug: string;
  subjectId: Types.ObjectId;
  order: number;
  isActive: boolean;
}

const TopicSchema = new Schema<ITopic>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TopicSchema.index({ subjectId: 1, slug: 1 }, { unique: true });

export const Topic = mongoose.model<ITopic>('Topic', TopicSchema);
