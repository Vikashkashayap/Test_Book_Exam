import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PricingConfig, DEFAULT_PRICING_PLANS, IPricingPlanItem } from '../models/PricingConfig';
import {
  formatConfig,
  getOrCreatePricingConfig,
  getPublishedPricing,
  isValidPlanId,
  slugifyPlanId,
} from '../services/pricing-config.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

function normalizePlans(raw: unknown): IPricingPlanItem[] {
  if (!Array.isArray(raw)) return DEFAULT_PRICING_PLANS;

  const seen = new Set<string>();

  return raw
    .map((item, index) => {
      const plan = item as Partial<IPricingPlanItem>;
      let planId = String(plan.planId ?? '').trim().toLowerCase();
      if (!planId && plan.name) planId = slugifyPlanId(plan.name);
      if (!planId || !isValidPlanId(planId)) return null;
      if (seen.has(planId)) return null;
      seen.add(planId);

      return {
        planId,
        name: String(plan.name ?? planId).trim(),
        price: Math.max(0, Number(plan.price ?? 0)),
        features: Array.isArray(plan.features)
          ? plan.features.map((f) => String(f).trim()).filter(Boolean)
          : [],
        popular: Boolean(plan.popular),
        isEnabled: plan.isEnabled !== false,
        ctaText: plan.ctaText ? String(plan.ctaText).trim() : undefined,
        order: Number.isFinite(plan.order) ? Number(plan.order) : index,
      } satisfies IPricingPlanItem;
    })
    .filter(Boolean) as IPricingPlanItem[];
}

export const getPublicPricing = asyncHandler(async (_req, res: Response) => {
  const data = await getPublishedPricing();
  res.json({ success: true, data });
});

export const getAdminPricing = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const config = await getOrCreatePricingConfig();
  res.json({
    success: true,
    data: formatConfig(config.toObject() as unknown as Record<string, unknown>),
  });
});

export const upsertPricing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, subtitle, plans, isPublished } = req.body;

  const normalizedPlans = normalizePlans(plans);
  if (!normalizedPlans.length) {
    throw new ApiError(400, 'At least one pricing plan is required');
  }

  const popularCount = normalizedPlans.filter((p) => p.popular).length;
  if (popularCount > 1) {
    throw new ApiError(400, 'Only one plan can be marked as Most Popular');
  }

  const payload = {
    title: String(title ?? 'Simple, transparent pricing').trim(),
    subtitle: String(
      subtitle ?? 'UPI, Cards, Net Banking supported via Razorpay. Cancel anytime.'
    ).trim(),
    plans: normalizedPlans,
    isPublished: isPublished !== false,
    updatedBy: req.user!.id,
  };

  const existing = await PricingConfig.findOne().sort({ updatedAt: -1 });
  const config = existing
    ? await PricingConfig.findByIdAndUpdate(existing._id, payload, { new: true }).lean()
    : await PricingConfig.create(payload).then((doc) => doc.toObject());

  res.json({ success: true, data: formatConfig(config as Record<string, unknown>) });
});
