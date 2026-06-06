import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Exam } from '../models/Exam';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

function generateReferralCode(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'MD';
  return `${base}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Step 1: Basic details — creates account */
export const registerStep1 = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, phone, referralCode } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) throw new ApiError(409, 'Email already registered');

  const hashed = await bcrypt.hash(password, 12);
  let referredBy;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (referrer) referredBy = referrer._id;
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashed,
    adminVisiblePassword: password,
    phone,
    role: 'student',
    onboardingStep: 1,
    referralCode: generateReferralCode(name),
    referredBy,
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokens = [refreshToken];
  await user.save();

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingStep: user.onboardingStep,
        referralCode: user.referralCode,
      },
      accessToken,
      nextStep: 2,
    },
  });
});

/** Step 2: Save category preferences (requires auth) */
export const registerStep2 = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { categorySlugs } = req.body;
  if (!Array.isArray(categorySlugs) || !categorySlugs.length) {
    throw new ApiError(400, 'Select at least one exam category');
  }

  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { selectedCategorySlugs: categorySlugs, onboardingStep: 2 },
    { new: true }
  );

  res.json({ success: true, data: { onboardingStep: 2, categorySlugs }, nextStep: 3 });
});

/** Step 3: Select exams & complete onboarding */
export const registerStep3 = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { examSlugs } = req.body;
  if (!Array.isArray(examSlugs) || !examSlugs.length) {
    throw new ApiError(400, 'Select at least one exam');
  }

  const exams = await Exam.find({ slug: { $in: examSlugs }, isActive: true });
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    {
      selectedExams: exams.map((e) => e._id),
      selectedExamSlugs: exams.map((e) => e.slug),
      'preferences.examCategories': [...new Set(exams.map((e) => e.categoryId))],
      onboardingCompleted: true,
      onboardingStep: 3,
    },
    { new: true }
  );

  res.json({
    success: true,
    data: {
      user: {
        id: user!._id,
        name: user!.name,
        selectedExamSlugs: user!.selectedExamSlugs,
        onboardingCompleted: true,
      },
    },
    redirect: '/dashboard',
  });
});
