'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminNotificationsPage() {
  return (
    <div className="p-6 md:p-8">
      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Email, WhatsApp, push & in-app — notification.service.ts
        </CardContent>
      </Card>
    </div>
  );
}
