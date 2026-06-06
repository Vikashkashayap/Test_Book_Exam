'use client';

import Link from 'next/link';
import { Target, TrendingUp, Award, Sparkles, BookOpen, Newspaper, FileText, MessageSquarePlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCardsSkeleton, DashboardSkeleton } from '@/components/ui/page-skeletons';
import { api, ApiSuccess } from '@/lib/api';
import { usePersonalizedDashboard } from '@/hooks/use-exams';
import { useQuery } from '@tanstack/react-query';
import { formatPercent } from '@/lib/utils';
import { PerformanceCharts } from '@/components/dashboard/PerformanceCharts';
import { useAuthStore } from '@/store/auth.store';

interface DashboardStats {
  stats: {
    testsAttempted: number;
    averageScore: number;
    rank: number | null;
    accuracy: number;
  };
  strongSubjects: { name: string; accuracy: number }[];
  weakSubjects: { name: string; accuracy: number }[];
  aiRecommendation: { strengths?: string[]; focusAreas?: string[]; message?: string };
  recentResults: { _id: string; percentage: number; testId: { title: string } }[];
}

const sectionIcons: Record<string, typeof BookOpen> = {
  tests: BookOpen,
  pyq: Target,
  current_affairs: Newspaper,
  notes: FileText,
  quiz: Sparkles,
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: personalized, isLoading: loadingPersonalized } = usePersonalizedDashboard();

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ['student-dashboard-stats'],
    queryFn: () => api<ApiSuccess<DashboardStats>>('/dashboard/student').then((r) => r.data),
  });

  if (loadingPersonalized && !personalized) {
    return (
      <div className="p-6 md:p-8">
        <DashboardSkeleton />
      </div>
    );
  }

  if (personalized?.needsOnboarding) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold">Complete your profile</h2>
        <p className="text-muted-foreground mt-2">Select your target exams for a personalized dashboard.</p>
        <Link href="/register?step=2">
          <Button className="mt-4">Choose Exams</Button>
        </Link>
      </div>
    );
  }

  const stats = statsData?.stats;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <p className="text-sm text-primary font-medium">MentorsDaily ExamPrep Pro</p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Hi {user?.name?.split(' ')[0] ?? 'Aspirant'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {personalized?.primaryExam
              ? `Preparing for ${personalized.primaryExam}`
              : 'Your personalized exam hub'}
            {personalized?.exams?.length
              ? ` · ${personalized.exams.length} exam(s) selected`
              : ''}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {personalized?.exams?.map((e) => (
              <Badge key={e.slug} variant="secondary">
                {e.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/feedback">
            <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
              <MessageSquarePlus className="h-4 w-4" />
              Send Feedback
            </Button>
          </Link>
          <Link href="/tests">
            <Button size="lg" className="w-full sm:w-auto">Start Mock Test</Button>
          </Link>
        </div>
      </motion.div>

      {loadingStats ? (
        <StatCardsSkeleton />
      ) : stats ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Tests Attempted', value: stats.testsAttempted, icon: Target },
            { label: 'Average Score', value: `${stats.averageScore}%`, icon: TrendingUp },
            { label: 'Global Rank', value: stats.rank ?? '—', icon: Award },
            { label: 'Accuracy', value: formatPercent(stats.accuracy), icon: Target },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className="h-8 w-8 text-primary/60" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : null}

      {loadingPersonalized ? (
        <div className="space-y-4">
          <Skeleton className="h-7 w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Your Exam Content</h2>
          {personalized?.sections?.map((section, idx) => {
            const Icon = sectionIcons[section.type] ?? BookOpen;
            return (
              <motion.div
                key={`${section.examSlug}-${section.type}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </div>
                    <Link href={section.href}>
                      <Button variant="ghost" size="sm">
                        View all
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const items = (section.items as any[] | undefined) ?? [];
                      if (!items.length) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            Content coming soon for {section.examName}
                          </p>
                        );
                      }

                      const isPracticeSection = ['tests', 'pyq', 'quiz'].includes(section.type);

                      if (!isPracticeSection) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            {items.length} items available
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {items.slice(0, 2).map((item) => (
                            <div key={item._id ?? item.slug ?? item.title} className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{item.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(item.totalQuestions ? `${item.totalQuestions} Q` : '')}
                                  {item.durationMinutes ? `${item.totalQuestions ? ' · ' : ''}${item.durationMinutes} min` : ''}
                                </p>
                              </div>
                              {item._id ? (
                                <Link href={`/tests/${item._id}/attempt`}>
                                  <Button size="sm" variant="secondary">
                                    Practice
                                  </Button>
                                </Link>
                              ) : null}
                            </div>
                          ))}
                          {items.length > 2 ? (
                            <p className="text-sm text-muted-foreground">{items.length - 2} more available</p>
                          ) : null}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {loadingStats ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
          <Card><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      ) : statsData ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
              <CardDescription>Score trends</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceCharts results={statsData.recentResults ?? []} />
            </CardContent>
          </Card>
          <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" /> AI Coach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {statsData.aiRecommendation?.message ??
                  statsData.aiRecommendation?.focusAreas?.join(', ') ??
                  'Complete a test for AI insights'}
              </p>
              <Link href="/ai-mentor">
                <Button variant="outline" size="sm" className="mt-4">
                  Open AI Mentor
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
