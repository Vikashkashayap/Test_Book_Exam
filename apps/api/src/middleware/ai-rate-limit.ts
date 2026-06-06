import rateLimit from 'express-rate-limit';

/** Stricter rate limit for AI generation endpoints */
export const aiGenerationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many AI generation requests. Please wait a few minutes before trying again.',
  },
  keyGenerator: (req) => {
    const user = (req as { user?: { id?: string } }).user;
    return user?.id ?? req.ip ?? 'anonymous';
  },
});
