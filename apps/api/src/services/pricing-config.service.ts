import {
  PricingConfig,
  DEFAULT_PRICING_PLANS,
  IPricingPlanItem,
  isValidPlanId,
  slugifyPlanId,
} from '../models/PricingConfig';

function formatConfig(doc: Record<string, unknown> | null) {
  if (!doc) return null;
  return {
    _id: String(doc._id),
    title: doc.title,
    subtitle: doc.subtitle,
    plans: (doc.plans as IPricingPlanItem[]).map((p) => ({
      planId: p.planId,
      name: p.name,
      price: p.price,
      features: p.features ?? [],
      popular: p.popular ?? false,
      isEnabled: p.isEnabled ?? true,
      ctaText: p.ctaText,
      order: p.order ?? 0,
    })),
    isPublished: doc.isPublished,
    updatedAt: doc.updatedAt,
  };
}

export async function getOrCreatePricingConfig() {
  let config = await PricingConfig.findOne().sort({ updatedAt: -1 });
  if (!config) {
    config = await PricingConfig.create({
      title: 'Simple, transparent pricing',
      subtitle: 'UPI, Cards, Net Banking supported via Razorpay. Cancel anytime.',
      plans: DEFAULT_PRICING_PLANS,
      isPublished: true,
    });
  }
  return config;
}

export async function getPublishedPricing() {
  const config = await getOrCreatePricingConfig();
  if (!config.isPublished) return null;

  const plans = [...config.plans]
    .filter((p) => p.isEnabled)
    .sort((a, b) => a.order - b.order);

  return {
    title: config.title,
    subtitle: config.subtitle,
    plans,
    updatedAt: config.updatedAt,
  };
}

export async function getPlanById(planId: string): Promise<IPricingPlanItem | null> {
  const config = await getOrCreatePricingConfig();
  const plan = config.plans.find((p) => p.planId === planId && p.isEnabled);
  return plan ?? null;
}

export async function getPlanPriceInr(planId: string): Promise<number> {
  const plan = await getPlanById(planId);
  if (plan) return plan.price;

  const config = await getOrCreatePricingConfig();
  const disabled = config.plans.find((p) => p.planId === planId);
  if (disabled) return disabled.price;

  const defaults: Record<string, number> = { free: 0, silver: 299, gold: 599, premium: 999 };
  return defaults[planId] ?? 0;
}

export async function getPayablePlan(planId: string): Promise<IPricingPlanItem> {
  const config = await getOrCreatePricingConfig();
  const plan = config.plans.find((p) => p.planId === planId);
  if (!plan || !plan.isEnabled) {
    throw new Error('Plan not found or disabled');
  }
  if (plan.price <= 0 || plan.planId === 'free') {
    throw new Error('This plan is free — no payment required');
  }
  return plan;
}

export { formatConfig, isValidPlanId, slugifyPlanId };
