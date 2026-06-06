import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAffiliate extends Document {
  userId: Types.ObjectId;
  code: string;
  totalEarnings: number;
  pendingPayout: number;
  paidOut: number;
  clicks: number;
  conversions: number;
  status: 'active' | 'suspended' | 'pending';
  payoutRequests: {
    amount: number;
    status: 'pending' | 'approved' | 'paid' | 'rejected';
    requestedAt: Date;
    processedAt?: Date;
  }[];
}

const AffiliateSchema = new Schema<IAffiliate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    code: { type: String, required: true, unique: true },
    totalEarnings: { type: Number, default: 0 },
    pendingPayout: { type: Number, default: 0 },
    paidOut: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'pending',
    },
    payoutRequests: [
      {
        amount: Number,
        status: { type: String, enum: ['pending', 'approved', 'paid', 'rejected'], default: 'pending' },
        requestedAt: { type: Date, default: Date.now },
        processedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

export const Affiliate = mongoose.model<IAffiliate>('Affiliate', AffiliateSchema);
