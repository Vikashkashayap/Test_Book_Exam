import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  /** Plain password copy for admin panel only (not returned in normal auth APIs) */
  adminVisiblePassword?: string;
  name: string;
  avatar?: string;
  phone?: string;
  role: 'student' | 'instructor' | 'admin' | 'super_admin';
  googleId?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isBanned: boolean;
  banReason?: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  subscriptionPlan: string;
  subscriptionExpiresAt?: Date;
  razorpayCustomerId?: string;
  points: number;
  xp: number;
  streak: number;
  lastActiveAt: Date;
  achievements: Types.ObjectId[];
  badges: string[];
  selectedExams: Types.ObjectId[];
  selectedExamSlugs: string[];
  selectedCategorySlugs: string[];
  referralCode: string;
  referredBy?: Types.ObjectId;
  preferences: {
    examCategories: Types.ObjectId[];
    language: 'en' | 'hi' | 'both';
    notifications: {
      email: boolean;
      whatsapp: boolean;
      push: boolean;
      inApp: boolean;
    };
    theme: 'light' | 'dark' | 'system';
  };
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, select: false },
    adminVisiblePassword: { type: String, select: false },
    name: { type: String, required: true, trim: true },
    avatar: String,
    phone: { type: String, sparse: true, index: true },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin', 'super_admin'],
      default: 'student',
      index: true,
    },
    googleId: { type: String, sparse: true, unique: true },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false, index: true },
    banReason: String,
    onboardingCompleted: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 0 },
    subscriptionPlan: {
      type: String,
      default: 'free',
      index: true,
    },
    subscriptionExpiresAt: Date,
    razorpayCustomerId: String,
    points: { type: Number, default: 0, index: true },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
    achievements: [{ type: Schema.Types.ObjectId, ref: 'Achievement' }],
    badges: [String],
    selectedExams: [{ type: Schema.Types.ObjectId, ref: 'Exam', index: true }],
    selectedExamSlugs: [{ type: String, index: true }],
    selectedCategorySlugs: [{ type: String }],
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    preferences: {
      examCategories: [{ type: Schema.Types.ObjectId, ref: 'ExamCategory' }],
      language: { type: String, enum: ['en', 'hi', 'both'], default: 'en' },
      notifications: {
        email: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
      },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },
    refreshTokens: { type: [String], select: false, default: [] },
  },
  { timestamps: true }
);

UserSchema.index({ selectedExamSlugs: 1 });
UserSchema.index({ role: 1, createdAt: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
