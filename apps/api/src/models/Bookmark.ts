import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBookmark extends Document {
  userId: Types.ObjectId;
  questionId: Types.ObjectId;
  testId?: Types.ObjectId;
  note?: string;
  tags: string[];
  reattemptCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    testId: { type: Schema.Types.ObjectId, ref: 'Test' },
    note: String,
    tags: [String],
    reattemptCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BookmarkSchema.index({ userId: 1, questionId: 1 }, { unique: true });

export const Bookmark = mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
