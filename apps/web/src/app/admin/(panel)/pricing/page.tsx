'use client';

import { useEffect, useState } from 'react';
import { IndianRupee, Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api, ApiSuccess } from '@/lib/api';
import { cn } from '@/lib/utils';

type PricingPlan = {
  planId: string;
  name: string;
  price: number;
  features: string[];
  popular: boolean;
  isEnabled: boolean;
  ctaText?: string;
  order: number;
};

type PricingConfig = {
  title: string;
  subtitle: string;
  plans: PricingPlan[];
  isPublished: boolean;
};

const defaultConfig: PricingConfig = {
  title: 'Simple, transparent pricing',
  subtitle: 'UPI, Cards, Net Banking supported via Razorpay. Cancel anytime.',
  isPublished: true,
  plans: [
    {
      planId: 'free',
      name: 'Free',
      price: 0,
      features: ['5 mock tests/month', 'Basic analytics', 'Daily quiz', 'Global leaderboard'],
      popular: false,
      isEnabled: true,
      ctaText: 'Get Started',
      order: 0,
    },
    {
      planId: 'silver',
      name: 'Silver',
      price: 299,
      features: ['50 mock tests/month', 'PDF notes', 'Weekly leaderboard', 'Email support'],
      popular: false,
      isEnabled: true,
      ctaText: 'Subscribe',
      order: 1,
    },
    {
      planId: 'gold',
      name: 'Gold',
      price: 599,
      features: ['Unlimited mock tests', 'AI analysis', 'All study materials', 'Topic-wise tests'],
      popular: true,
      isEnabled: true,
      ctaText: 'Subscribe',
      order: 2,
    },
    {
      planId: 'premium',
      name: 'Premium',
      price: 999,
      features: ['Everything in Gold', 'AI mentor chat', 'Live rankings', 'Priority support'],
      popular: false,
      isEnabled: true,
      ctaText: 'Subscribe',
      order: 3,
    },
  ],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminPricingPage() {
  const [config, setConfig] = useState<PricingConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api<ApiSuccess<PricingConfig>>('/admin/pricing')
      .then((res) => {
        if (res.data?.plans?.length) {
          setConfig({
            ...defaultConfig,
            ...res.data,
            plans: [...res.data.plans].sort((a, b) => a.order - b.order),
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function updatePlan(index: number, patch: Partial<PricingPlan>) {
    setConfig((prev) => ({
      ...prev,
      plans: prev.plans.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }

  function setPopular(index: number) {
    setConfig((prev) => ({
      ...prev,
      plans: prev.plans.map((p, i) => ({ ...p, popular: i === index })),
    }));
  }

  function updateFeatures(index: number, text: string) {
    updatePlan(index, {
      features: text.split('\n').map((f) => f.trim()).filter(Boolean),
    });
  }

  function addPlan() {
    const baseId = `plan-${Date.now().toString(36)}`;
    setConfig((prev) => ({
      ...prev,
      plans: [
        ...prev.plans,
        {
          planId: baseId,
          name: 'New Plan',
          price: 499,
          features: ['Feature 1', 'Feature 2'],
          popular: false,
          isEnabled: true,
          ctaText: 'Subscribe',
          order: prev.plans.length,
        },
      ],
    }));
  }

  function removePlan(index: number) {
    const plan = config.plans[index];
    if (plan.planId === 'free') {
      setMessage('Free plan cannot be removed');
      return;
    }
    setConfig((prev) => ({
      ...prev,
      plans: prev.plans
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, order: i })),
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const normalized = {
      ...config,
      plans: config.plans.map((p, index) => ({
        ...p,
        planId: slugify(p.planId || p.name) || `plan-${index}`,
        order: index,
      })),
    };

    try {
      await api('/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify(normalized),
      });
      setConfig(normalized);
      setMessage('Pricing published successfully');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save pricing');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-x-hidden space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">MentorsDaily ExamPrep Pro</p>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <IndianRupee className="h-7 w-7 text-primary" />
            Pricing Plans
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit or remove plans — payments go through Razorpay
          </p>
        </div>
        <Button type="button" variant="outline" className="min-h-[44px] gap-2" onClick={addPlan}>
          <Plus className="h-4 w-4" /> Add Plan
        </Button>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading pricing...
        </p>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Header</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  className="mt-1"
                  value={config.title}
                  onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subtitle</label>
                <Input
                  className="mt-1"
                  value={config.subtitle}
                  onChange={(e) => setConfig((c) => ({ ...c, subtitle: e.target.value }))}
                />
              </div>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={config.isPublished}
                  onChange={(e) => setConfig((c) => ({ ...c, isPublished: e.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm font-medium">Publish pricing on website</span>
              </label>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {config.plans.map((plan, index) => (
              <Card key={`${plan.planId}-${index}`} className={plan.popular ? 'border-primary shadow-md' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription className="mt-1">Plan ID: {plan.planId}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.popular && <Badge>Most Popular</Badge>}
                      {plan.planId !== 'free' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive"
                          onClick={() => removePlan(index)}
                          aria-label="Remove plan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Plan name</label>
                      <Input
                        className="mt-1"
                        value={plan.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          updatePlan(index, {
                            name,
                            planId:
                              plan.planId.startsWith('plan-') || !plan.planId
                                ? slugify(name) || plan.planId
                                : plan.planId,
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Plan ID (slug)</label>
                      <Input
                        className="mt-1"
                        value={plan.planId}
                        onChange={(e) => updatePlan(index, { planId: slugify(e.target.value) })}
                        disabled={plan.planId === 'free'}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium">Price (₹/month)</label>
                      <Input
                        className="mt-1"
                        type="number"
                        min={0}
                        value={plan.price}
                        onChange={(e) => updatePlan(index, { price: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Features (one per line)</label>
                    <textarea
                      className="mt-1 min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={plan.features.join('\n')}
                      onChange={(e) => updateFeatures(index, e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Button text</label>
                    <Input
                      className="mt-1"
                      value={plan.ctaText ?? ''}
                      onChange={(e) => updatePlan(index, { ctaText: e.target.value })}
                      placeholder={plan.price === 0 ? 'Get Started' : 'Subscribe'}
                    />
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={plan.isEnabled}
                        onChange={(e) => updatePlan(index, { isEnabled: e.target.checked })}
                        className="h-4 w-4 accent-primary"
                      />
                      Show on website
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="popular-plan"
                        checked={plan.popular}
                        onChange={() => setPopular(index)}
                      />
                      Most Popular
                    </label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" className="min-h-[44px]" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
                </>
              ) : (
                'Publish Pricing'
              )}
            </Button>
            {message ? (
              <span className={cn('text-sm', message.includes('success') ? 'text-green-600' : 'text-destructive')}>
                {message}
              </span>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}
