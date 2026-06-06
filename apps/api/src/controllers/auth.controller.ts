import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';
import { sendWelcomeEmail } from '../services/email.service';
import { updateStreak } from '../services/gamification.service';

const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
  : null;

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProd = env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth/refresh',
  });
}

function formatUserResponse(user: InstanceType<typeof User>) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    subscriptionPlan: user.subscriptionPlan,
    points: user.points,
    streak: user.streak,
  };
}

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, name, phone } = req.body;

  const normalizedEmail = String(email).toLowerCase().trim();
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    if (exists.role === 'admin' || exists.role === 'super_admin') {
      throw new ApiError(409, 'Admin account exists. Please sign in.');
    }
    throw new ApiError(409, 'Email already registered. Please sign in.');
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({
    email: normalizedEmail,
    password: hashed,
    adminVisiblePassword: password,
    name,
    phone,
    role: 'student',
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokens = [refreshToken];
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);
  await sendWelcomeEmail(user.email, user.name);

  res.status(201).json({
    success: true,
    data: {
      user: formatUserResponse(user),
      accessToken,
    },
  });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select(
    '+password +refreshTokens'
  );
  if (!user || !user.password) throw new ApiError(401, 'Invalid credentials');
  if (user.isBanned) throw new ApiError(403, 'Account suspended');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new ApiError(401, 'Invalid credentials');

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokens = [...(user.refreshTokens ?? []).slice(-4), refreshToken];
  user.lastActiveAt = new Date();
  await user.save();

  await updateStreak(user._id.toString());
  setAuthCookies(res, accessToken, refreshToken);

  res.json({
    success: true,
    data: {
      user: formatUserResponse(user),
      accessToken,
    },
  });
});

export const googleLogin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { credential } = req.body;
  if (!googleClient || !credential) throw new ApiError(400, 'Google login not configured');

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) throw new ApiError(401, 'Invalid Google token');

  let user = await User.findOne({
    $or: [{ googleId: payload.sub }, { email: payload.email }],
  }).select('+refreshTokens');

  if (!user) {
    user = await User.create({
      email: payload.email,
      name: payload.name ?? payload.email.split('@')[0],
      googleId: payload.sub,
      avatar: payload.picture,
      isEmailVerified: payload.email_verified ?? false,
      role: 'student',
    });
    await sendWelcomeEmail(user.email, user.name);
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    user.avatar = user.avatar ?? payload.picture;
    await user.save();
  }

  if (user.isBanned) throw new ApiError(403, 'Account suspended');

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokens = [...(user.refreshTokens ?? []).slice(-4), refreshToken];
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        subscriptionPlan: user.subscriptionPlan,
      },
      accessToken,
    },
  });
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.cookies?.refreshToken ?? req.body.refreshToken;
  if (!token) throw new ApiError(401, 'Refresh token required');

  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.userId).select('+refreshTokens');
  if (!user || !user.refreshTokens?.includes(token)) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokens = user.refreshTokens.filter((t) => t !== token).concat(refreshToken);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);
  res.json({ success: true, data: { accessToken } });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token && req.user) {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { refreshTokens: token },
    });
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
  res.json({ success: true, message: 'Logged out' });
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id)
    .populate('achievements', 'name icon points')
    .lean();
  if (!user) throw new ApiError(404, 'User not found');
  res.json({
    success: true,
    data: {
      ...user,
      id: user._id.toString(),
    },
  });
});

/** Development only — promote user to super_admin for testing admin panel */
export const makeAdminDev = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (env.NODE_ENV === 'production') {
    throw new ApiError(403, 'Not available in production');
  }

  const email = (req.body.email as string)?.toLowerCase()?.trim() || 'admin@examprep.com';
  const password = (req.body.password as string) || 'Admin@123456';
  const name = (req.body.name as string) || 'Super Admin';

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate(
    { email },
    {
      email,
      password: hashed,
      name,
      role: 'super_admin',
      isEmailVerified: true,
      isBanned: false,
      subscriptionPlan: 'premium',
    },
    { upsert: true, new: true }
  );

  res.json({
    success: true,
    message: 'Admin account ready. Logout and login again with these credentials.',
    data: {
      email: user.email,
      password,
      role: user.role,
      loginUrl: `${env.FRONTEND_URL}/login`,
      adminUrl: `${env.FRONTEND_URL}/admin`,
    },
  });
});
