import { OtpSession } from '../models/OtpSession';
import { User } from '../models/User';
import { env } from '../config/env';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(phone: string): Promise<{ success: boolean; devOtp?: string }> {
  const normalized = phone.replace(/\D/g, '').slice(-10);
  if (normalized.length !== 10) {
    throw new Error('Invalid phone number');
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OtpSession.deleteMany({ phone: normalized });
  await OtpSession.create({ phone: normalized, otp, expiresAt });

  // Production: integrate MSG91 / Twilio / WhatsApp Business API
  if (env.NODE_ENV === 'development') {
    console.log(`[OTP] ${normalized} → ${otp}`);
    return { success: true, devOtp: otp };
  }

  return { success: true };
}

export async function verifyOtp(
  phone: string,
  otp: string
): Promise<{ valid: boolean; user?: InstanceType<typeof User> }> {
  const normalized = phone.replace(/\D/g, '').slice(-10);
  const session = await OtpSession.findOne({
    phone: normalized,
    verified: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!session) return { valid: false };
  if (session.attempts >= 5) return { valid: false };

  if (session.otp !== otp) {
    session.attempts += 1;
    await session.save();
    return { valid: false };
  }

  session.verified = true;
  await session.save();

  let user = await User.findOne({ phone: normalized });
  if (!user) {
    user = await User.create({
      email: `${normalized}@phone.examprep.local`,
      name: `User ${normalized.slice(-4)}`,
      phone: normalized,
      isPhoneVerified: true,
      role: 'student',
    });
  } else {
    user.isPhoneVerified = true;
    await user.save();
  }

  return { valid: true, user };
}
