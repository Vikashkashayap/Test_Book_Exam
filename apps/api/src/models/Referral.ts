import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReferral extends Document {
  referrerId: Types.ObjectId;
  referredUserId: Types.ObjectId;
  referralCode: string;
  status: 'pending' | 'completed' | 'rewarded';
  rewardAmount: number;
  commissionPercent: number;
  createdAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referredUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    referralCode: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rewarded'],
      default: 'pending',
    },
    rewardAmount: { type: Number, default: 0 },
    commissionPercent: { type: Number, default: 10 },
  },
  { timestamps: true }
);

export const Referral = mongoose.model<IReferral>('Referral', ReferralSchema);
