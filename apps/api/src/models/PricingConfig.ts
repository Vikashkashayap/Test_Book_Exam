import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPricingPlanItem {
  planId: string;
  name: string;
  price: number;
  features: string[];
  popular: boolean;
  isEnabled: boolean;
  ctaText?: string;
  order: number;
}

export interface IPricingConfig extends Document {
  title: string;
  subtitle: string;
  plans: IPricingPlanItem[];
  isPublished: boolean;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PricingPlanItemSchema = new Schema<IPricingPlanItem>(
  {
    planId: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    features: { type: [String], default: [] },
    popular: { type: Boolean, default: false },
    isEnabled: { type: Boolean, default: true },
    ctaText: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const PricingConfigSchema = new Schema<IPricingConfig>(
  {
    title: { type: String, default: 'Simple, transparent pricing', trim: true },
    subtitle: {
      type: String,
      default: 'UPI, Cards, Net Banking supported via Razorpay. Cancel anytime.',
      trim: true,
    },
    plans: { type: [PricingPlanItemSchema], default: [] },
    isPublished: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const PricingConfig = mongoose.model<IPricingConfig>('PricingConfig', PricingConfigSchema);

export const DEFAULT_PRICING_PLANS: IPricingPlanItem[] = [
  {
    planId: 'free',
    name: 'Free',
    price: 0,
    features: ['5 mock tests/month', 'Basic analytics', 'Daily quiz', 'Global leaderboard'],
    popular: false,
    isEnabled: true,
    ctaText: 'Get Started',
    order: 0,
  },
  {
    planId: 'silver',
    name: 'Silver',
    price: 299,
    features: ['50 mock tests/month', 'PDF notes', 'Weekly leaderboard', 'Email support'],
    popular: false,
    isEnabled: true,
    ctaText: 'Subscribe',
    order: 1,
  },
  {
    planId: 'gold',
    name: 'Gold',
    price: 599,
    features: ['Unlimited mock tests', 'AI analysis', 'All study materials', 'Topic-wise tests'],
    popular: true,
    isEnabled: true,
    ctaText: 'Subscribe',
    order: 2,
  },
  {
    planId: 'premium',
    name: 'Premium',
    price: 999,
    features: ['Everything in Gold', 'AI mentor chat', 'Live rankings', 'Priority support'],
    popular: false,
    isEnabled: true,
    ctaText: 'Subscribe',
    order: 3,
  },
];

export function slugifyPlanId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidPlanId(planId: string): boolean {
  return /^[a-z0-9-]{2,40}$/.test(planId);
}
