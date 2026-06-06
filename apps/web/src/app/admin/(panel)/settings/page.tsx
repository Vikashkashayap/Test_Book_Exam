'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <div className="p-6 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Categories, subjects, topics, and subscription configuration
        </CardContent>
      </Card>
    </div>
  );
}
