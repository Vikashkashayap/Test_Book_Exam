import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpSession extends Document {
  phone: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

const OtpSessionSchema = new Schema<IOtpSession>(
  {
    phone: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

OtpSessionSchema.index({ phone: 1, createdAt: -1 });

export const OtpSession = mongoose.model<IOtpSession>('OtpSession', OtpSessionSchema);
