import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITestSection {
  name: string;
  subjectId: Types.ObjectId;
  questionIds: Types.ObjectId[];
  marksPerQuestion: number;
  negativeMarks: number;
}

export interface ITest extends Document {
  title: string;
  slug: string;
  description?: string;
  type:
    | 'full_length'
    | 'sectional'
    | 'subject_wise'
    | 'topic_wise'
    | 'daily_quiz'
    | 'practice_set'
    | 'previous_year'
    | 'custom';
  examId: Types.ObjectId;
  examSlug: string;
  examSlugs: string[];
  examCategoryId: Types.ObjectId;
  categorySlug: string;
  subjectId?: Types.ObjectId;
  topicId?: Types.ObjectId;
  sections: ITestSection[];
  questionIds: Types.ObjectId[];
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  negativeMarking: boolean;
  passingMarks?: number;
  requiredPlan: 'free' | 'silver' | 'gold' | 'premium';
  scheduledAt?: Date;
  publishedAt?: Date;
  endsAt?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  isLive: boolean;
  attemptCount: number;
  createdBy: Types.ObjectId;
  clonedFrom?: Types.ObjectId;
  year?: number;
  instructions?: string;
  source?: 'manual' | 'AI' | 'import' | 'question_bank';
  subjects?: string[];
  aiBatchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TestSchema = new Schema<ITest>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    type: {
      type: String,
      enum: [
        'full_length',
        'sectional',
        'subject_wise',
        'topic_wise',
        'daily_quiz',
        'practice_set',
        'previous_year',
        'custom',
      ],
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    examSlug: { type: String, required: true, index: true },
    examSlugs: [{ type: String, index: true }],
    examCategoryId: { type: Schema.Types.ObjectId, ref: 'ExamCategory', required: true, index: true },
    categorySlug: { type: String, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
    sections: [
      {
        name: String,
        subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
        questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
        marksPerQuestion: { type: Number, default: 1 },
        negativeMarks: { type: Number, default: 0 },
      },
    ],
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    totalQuestions: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    negativeMarking: { type: Boolean, default: true },
    passingMarks: Number,
    requiredPlan: {
      type: String,
      enum: ['free', 'silver', 'gold', 'premium'],
      default: 'free',
    },
    scheduledAt: Date,
    publishedAt: Date,
    endsAt: Date,
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    isLive: { type: Boolean, default: false },
    attemptCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clonedFrom: { type: Schema.Types.ObjectId, ref: 'Test' },
    year: Number,
    instructions: String,
    source: { type: String, enum: ['manual', 'AI', 'import', 'question_bank'], default: 'manual' },
    subjects: [String],
    aiBatchId: String,
  },
  { timestamps: true }
);

TestSchema.index({ status: 1, type: 1, publishedAt: -1 });
TestSchema.index({ examCategoryId: 1, type: 1 });
TestSchema.index({ examSlug: 1, status: 1 });

export const Test = mongoose.model<ITest>('Test', TestSchema);
