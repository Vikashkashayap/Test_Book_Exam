'use client';

import { useEffect, useState } from 'react';
import { Users, DollarSign, Activity, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminDashboardSkeleton } from '@/components/ui/page-skeletons';
import { api, ApiSuccess } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AdminStats {
  totalStudents: number;
  activeUsers: number;
  testAttempts: number;
  revenue: number;
  subscriptionBreakdown: { _id: string; count: number }[];
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<ApiSuccess<AdminStats>>('/admin/dashboard')
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="overflow-x-hidden p-4 sm:p-6 md:p-8">
        <AdminDashboardSkeleton />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Could not load admin data. Ensure API is running and you are logged in as admin.
      </div>
    );
  }

  const chartData = stats.subscriptionBreakdown.map((s) => ({
    plan: s._id ?? 'unknown',
    users: s.count,
  }));

  return (
    <div className="overflow-x-hidden p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">MentorsDaily ExamPrep Pro</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Platform overview & analytics</p>
        </div>
        <span className="text-xs text-muted-foreground sm:text-sm">
          {user?.name} · {user?.role}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Students', value: stats.totalStudents, icon: Users },
          { label: 'Revenue (INR)', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: DollarSign },
          { label: 'Active Users (30d)', value: stats.activeUsers, icon: Activity },
          { label: 'Test Attempts', value: stats.testAttempts, icon: FileText },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
              <s.icon className="h-8 w-8 text-primary/60" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Analytics</CardTitle>
        </CardHeader>
        <CardContent className="h-56 min-h-[14rem] sm:h-72">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="plan" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">No subscription data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
