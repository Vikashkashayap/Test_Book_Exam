'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, ApiSuccess } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

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
          name: 'MentorsDaily ExamPrep Pro',
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
          theme: { color: '#3b82f6' },
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pricing?.plans?.length) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        Pricing is not available right now. Please check back later.
      </div>
    );
  }

  return (
    <div className="container mx-auto overflow-x-hidden px-4 py-12 sm:py-16">
      <div className="mb-10 text-center sm:mb-12">
        <h1 className="text-3xl font-bold sm:text-4xl">{pricing.title}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          {pricing.subtitle}
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {pricing.plans.map((plan) => (
          <Card
            key={plan.planId}
            className={plan.popular ? 'border-primary shadow-lg lg:scale-105' : ''}
          >
            <CardHeader>
              {plan.popular && <Badge className="mb-2 w-fit">Most Popular</Badge>}
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">₹{plan.price}</span>
                {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="min-h-[44px] w-full"
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
  );
}
