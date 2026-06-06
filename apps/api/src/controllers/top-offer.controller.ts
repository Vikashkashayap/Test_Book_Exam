import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TopOffer } from '../models/TopOffer';
import { asyncHandler } from '../utils/asyncHandler';

function formatOffer(offer: Record<string, unknown> | null) {
  if (!offer) return null;
  return {
    _id: String(offer._id),
    headline: offer.headline,
    message: offer.message,
    badgeText: offer.badgeText,
    ctaText: offer.ctaText,
    ctaUrl: offer.ctaUrl,
    isEnabled: offer.isEnabled,
    updatedAt: offer.updatedAt,
  };
}

export const getPublicTopOffer = asyncHandler(async (_req, res: Response) => {
  const offer = await TopOffer.findOne({ isEnabled: true }).sort({ updatedAt: -1 }).lean();
  res.json({ success: true, data: formatOffer(offer) });
});

export const getAdminTopOffer = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const offer = await TopOffer.findOne().sort({ updatedAt: -1 }).lean();
  res.json({ success: true, data: formatOffer(offer) });
});

export const upsertTopOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { headline, message, badgeText, ctaText, ctaUrl, isEnabled } = req.body;

  const payload = {
    headline: String(headline ?? 'Limited Time Offer').trim(),
    message: String(
      message ?? 'Get exclusive discounts on our courses. One conversation can change your journey!'
    ).trim(),
    badgeText: String(badgeText ?? '25% OFF').trim(),
    ctaText: String(ctaText ?? 'Claim Offer').trim(),
    ctaUrl: String(ctaUrl ?? '/pricing').trim(),
    isEnabled: Boolean(isEnabled),
    updatedBy: req.user!.id,
  };

  const existing = await TopOffer.findOne().sort({ updatedAt: -1 });
  const offer = existing
    ? await TopOffer.findByIdAndUpdate(existing._id, payload, { new: true }).lean()
    : await TopOffer.create(payload).then((doc) => doc.toObject());

  res.json({ success: true, data: formatOffer(offer as Record<string, unknown>) });
});
