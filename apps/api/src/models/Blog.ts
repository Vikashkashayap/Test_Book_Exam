import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  imageUrl?: string;
  author?: string;
  category?: string;
  isPublished: boolean;
  showOnHomepage: boolean;
  publishedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    excerpt: String,
    content: { type: String, required: true },
    imageUrl: String,
    author: { type: String, default: 'MentorsDaily Team' },
    category: { type: String, default: 'General' },
    isPublished: { type: Boolean, default: false, index: true },
    showOnHomepage: { type: Boolean, default: false, index: true },
    publishedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

BlogSchema.index({ isPublished: 1, showOnHomepage: 1, publishedAt: -1 });

export const Blog = mongoose.model<IBlog>('Blog', BlogSchema);
