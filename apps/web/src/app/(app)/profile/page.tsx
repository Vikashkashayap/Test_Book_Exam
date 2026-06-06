'use client';

import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p>{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <Badge>{user.subscriptionPlan}</Badge>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Points</p>
              <p className="text-xl font-bold">{user.points ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Streak</p>
              <p className="text-xl font-bold">{user.streak ?? 0} days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
