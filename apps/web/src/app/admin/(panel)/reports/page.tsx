'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminReportsPage() {
  return (
    <div className="p-6 md:p-8">
      <Card>
        <CardHeader><CardTitle>Reports & Analytics</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Revenue, active students, exam-wise analytics, test attempts
        </CardContent>
      </Card>
    </div>
  );
}
