'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPaymentsPage() {
  return (
    <div className="p-6 md:p-8">
      <Card>
        <CardHeader><CardTitle>Payments & Subscriptions</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Razorpay orders, plans, coupons — integrated via /api/v1/payments
        </CardContent>
      </Card>
    </div>
  );
}
