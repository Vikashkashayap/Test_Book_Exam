import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITopOffer extends Document {
  headline: string;
  message: string;
  badgeText: string;
  ctaText: string;
  ctaUrl: string;
  isEnabled: boolean;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TopOfferSchema = new Schema<ITopOffer>(
  {
    headline: { type: String, default: 'Limited Time Offer', trim: true },
    message: {
      type: String,
      default: 'Get exclusive discounts on our courses. One conversation can change your journey!',
      trim: true,
    },
    badgeText: { type: String, default: '25% OFF', trim: true },
    ctaText: { type: String, default: 'Claim Offer', trim: true },
    ctaUrl: { type: String, default: '/pricing', trim: true },
    isEnabled: { type: Boolean, default: false, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const TopOffer = mongoose.model<ITopOffer>('TopOffer', TopOfferSchema);
