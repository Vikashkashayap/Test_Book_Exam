import mongoose, { Schema, Document, Types } from 'mongoose';

export type FeedbackCategory = 'bug' | 'improvement' | 'feature' | 'other';
export type FeedbackStatus = 'new' | 'reviewed' | 'resolved';

export interface IFeedback extends Document {
  userId: Types.ObjectId;
  category: FeedbackCategory;
  subject: string;
  message: string;
  pageUrl?: string;
  status: FeedbackStatus;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: ['bug', 'improvement', 'feature', 'other'],
      required: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    pageUrl: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['new', 'reviewed', 'resolved'],
      default: 'new',
      index: true,
    },
    adminNote: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

FeedbackSchema.index({ status: 1, createdAt: -1 });

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
