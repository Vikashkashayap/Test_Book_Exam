import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  plan: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  razorpaySubscriptionId?: string;
  razorpayPlanId?: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  features: string[];
  testsRemaining?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'pending'],
      default: 'pending',
      index: true,
    },
    razorpaySubscriptionId: { type: String, sparse: true, index: true },
    razorpayPlanId: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    autoRenew: { type: Boolean, default: true },
    features: [String],
    testsRemaining: Number,
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, status: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
