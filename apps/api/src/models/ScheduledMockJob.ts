import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IScheduledMockJob extends Document {
  title?: string;
  examId: Types.ObjectId;
  examSlug: string;
  subjects: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount: number;
  durationMinutes: number;
  mockType: 'subject_based' | 'subject_test' | 'full_length' | 'practice_set' | 'pyq';
  year?: number;
  avoidReuse: boolean;
  autoGenerate: boolean;
  scheduledAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  testId?: Types.ObjectId;
  error?: string;
  processedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledMockJobSchema = new Schema<IScheduledMockJob>(
  {
    title: String,
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    examSlug: { type: String, required: true, index: true },
    subjects: [{ type: String }],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      required: true,
    },
    questionCount: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    mockType: {
      type: String,
      enum: ['subject_based', 'subject_test', 'full_length', 'practice_set', 'pyq'],
      default: 'full_length',
    },
    year: Number,
    avoidReuse: { type: Boolean, default: true },
    autoGenerate: { type: Boolean, default: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    testId: { type: Schema.Types.ObjectId, ref: 'Test' },
    error: String,
    processedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ScheduledMockJobSchema.index({ status: 1, scheduledAt: 1 });

export const ScheduledMockJob = mongoose.model<IScheduledMockJob>(
  'ScheduledMockJob',
  ScheduledMockJobSchema
);
