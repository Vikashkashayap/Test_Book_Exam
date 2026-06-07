'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, ApiSuccess } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type PricingPlan = {
  planId: string;
  name: string;
  price: number;
  features: string[];
  popular: boolean;
  ctaText?: string;
};

type PricingData = {
  title: string;
  subtitle: string;
  plans: PricingPlan[];
};

const accentTextClass =
  'bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function PricingPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PricingData | null>(null);

  useEffect(() => {
    api<ApiSuccess<PricingData | null>>('/content/pricing')
      .then((res) => setPricing(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || loading || !pricing?.plans?.length) return;

    const pendingPlanId = sessionStorage.getItem('pendingSubscriptionPlan');
    if (!pendingPlanId) return;

    const pendingPlan = pricing.plans.find((p) => p.planId === pendingPlanId);
    if (!pendingPlan || pendingPlan.price === 0) {
      sessionStorage.removeItem('pendingSubscriptionPlan');
      return;
    }

    sessionStorage.removeItem('pendingSubscriptionPlan');
    subscribe(pendingPlan.planId, pendingPlan.price);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resume checkout once after login
  }, [user, loading, pricing]);

  async function subscribe(planId: string, price: number) {
    if (planId === 'free' || price === 0) {
      router.push('/register');
      return;
    }
    if (!user) {
      sessionStorage.setItem('pendingSubscriptionPlan', planId);
      router.push('/login?redirect=/pricing&reason=subscribe');
      return;
    }

    setPayLoading(planId);
    try {
      const res = await api<ApiSuccess<{ orderId: string; amount: number; keyId: string; planName?: string }>>(
        '/payments/create-order',
        { method: 'POST', body: JSON.stringify({ plan: planId }) }
      );

      if (!res.data.keyId) {
        alert('Razorpay is not configured on the server.');
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const rzp = new window.Razorpay!({
          key: res.data.keyId,
          amount: res.data.amount,
          currency: 'INR',
          name: 'Abhyas by MentorsDaily ExamPrep Pro',
          description: `${res.data.planName ?? planId} subscription`,
          order_id: res.data.orderId,
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            await api('/payments/verify', {
              method: 'POST',
              body: JSON.stringify(response),
            });
            router.push('/dashboard');
          },
          prefill: { email: user.email, name: user.name },
          theme: { color: '#38bdf8' },
        });
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (e) {
      console.error(e);
      alert('Payment initialization failed. Check Razorpay configuration.');
    } finally {
      setPayLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#071428]">
        <Loader2 className="h-6 w-6 animate-spin text-sky-300" />
      </div>
    );
  }

  if (!pricing?.plans?.length) {
    return (
      <div className="container mx-auto bg-[#071428] px-4 py-16 text-center text-blue-100/70">
        Pricing is not available right now. Please check back later.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071428] text-white">
      <div className="container mx-auto overflow-x-hidden px-6 py-12 sm:px-8 sm:py-16 md:px-10 lg:px-14">
        <div className="mb-10 text-center sm:mb-12">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Simple,{' '}
            <span className={accentTextClass}>transparent pricing</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-blue-100/75 sm:mt-4 sm:text-base">
            {pricing.subtitle}
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {pricing.plans.map((plan) => (
            <Card
              key={plan.planId}
              className={cn(
                'border bg-[#0d1f3c]/90 text-white shadow-lg shadow-black/20 transition-all hover:shadow-xl',
                plan.popular
                  ? 'border-sky-400/50 shadow-sky-950/20 lg:scale-105'
                  : 'border-white/10 hover:border-sky-400/25'
              )}
            >
              <CardHeader>
                {plan.popular && (
                  <Badge className="mb-2 w-fit border-0 bg-gradient-to-r from-sky-300 to-blue-400 text-[#071428] hover:from-sky-200 hover:to-blue-300">
                    Most Popular
                  </Badge>
                )}
                <CardTitle className={cn('text-xl', plan.popular && accentTextClass)}>
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-blue-100/70">
                  <span className={cn('text-3xl font-bold', plan.popular ? accentTextClass : 'text-white')}>
                    ₹{plan.price}
                  </span>
                  {plan.price > 0 && <span className="text-blue-200/60">/month</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-blue-100/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={cn(
                    'min-h-[44px] w-full rounded-full font-semibold',
                    plan.popular
                      ? 'bg-gradient-to-r from-sky-300 to-blue-400 text-[#071428] hover:from-sky-200 hover:to-blue-300'
                      : 'border-2 border-sky-400/40 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20 hover:text-white'
                  )}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => subscribe(plan.planId, plan.price)}
                  disabled={payLoading === plan.planId}
                >
                  {payLoading === plan.planId
                    ? 'Processing...'
                    : plan.ctaText || (plan.price === 0 ? 'Get Started' : 'Subscribe')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
