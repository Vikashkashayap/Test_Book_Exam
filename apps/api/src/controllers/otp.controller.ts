import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendOtp, verifyOtp } from '../services/otp.service';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export const requestOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phone } = req.body;
  if (!phone) throw new ApiError(400, 'Phone required');

  const result = await sendOtp(phone);
  res.json({
    success: true,
    message: 'OTP sent',
    ...(env.NODE_ENV === 'development' && result.devOtp ? { devOtp: result.devOtp } : {}),
  });
});

export const verifyOtpLogin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phone, otp } = req.body;
  const result = await verifyOtp(phone, otp);
  if (!result.valid || !result.user) throw new ApiError(401, 'Invalid or expired OTP');

  const user = result.user;
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokens = [...(user.refreshTokens ?? []).slice(-4), refreshToken];
  await user.save();

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
        selectedExamSlugs: user.selectedExamSlugs,
      },
      accessToken,
      redirect: user.onboardingCompleted ? '/dashboard' : '/register?step=2',
    },
  });
});
