'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Clock, FileQuestion, CheckCircle2, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardGridSkeleton } from '@/components/ui/page-skeletons';
import { Pagination, type PaginationMeta } from '@/components/ui/pagination';
import { api, ApiSuccess } from '@/lib/api';
import { formatPercent } from '@/lib/utils';

interface UserResult {
  resultId: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
}

interface TestItem {
  _id: string;
  title: string;
  type: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  requiredPlan: string;
  userResult?: UserResult;
}

const typeLabels: Record<string, string> = {
  full_length: 'Full Length Mock',
  subject_wise: 'Subject Test',
  practice_set: 'Practice Set',
  topic_wise: 'Topic Wise',
  daily_quiz: 'Daily Quiz',
  previous_year: 'Previous Year',
};

const PAGE_SIZE = 12;

export default function TestsPage() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const exam = searchParams.get('exam');
  const typeParam = searchParams.get('type');

  const isCompletedTab = filter === 'completed';

  useEffect(() => {
    setFilter(typeParam ?? '');
    setPage(1);
  }, [typeParam, exam]);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (isCompletedTab) {
      qs.set('completed', 'true');
    } else if (filter) {
      qs.set('type', filter);
    }
    if (exam) qs.set('exam', exam);
    qs.set('page', String(page));
    qs.set('limit', String(PAGE_SIZE));

    api<ApiSuccess<TestItem[]>>(`/tests?${qs.toString()}`)
      .then((res) => {
        setTests(res.data);
        if (res.meta) setMeta(res.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter, exam, page, isCompletedTab]);

  function handleFilterChange(value: string) {
    setFilter(value);
    setPage(1);
  }

  const filterTabs = [
    { value: '', label: 'All' },
    { value: 'full_length', label: 'Full Length Mock' },
    { value: 'subject_wise', label: 'Subject Test' },
    { value: 'practice_set', label: 'Practice Set' },
    { value: 'daily_quiz', label: 'Daily Quiz' },
    { value: 'previous_year', label: 'Previous Year' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">My Tests</h1>
        <p className="text-muted-foreground">
          {isCompletedTab ? 'Tests you have already completed' : 'Tests for your selected exams only'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <Button
            key={tab.value || 'all'}
            variant={filter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange(tab.value)}
            className={tab.value === 'completed' ? 'gap-1.5' : undefined}
          >
            {tab.value === 'completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
            {tab.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tests.map((test) => (
              <Card
                key={test._id}
                className={`hover:shadow-md transition-shadow ${isCompletedTab ? 'border-green-200/60' : ''}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary">{typeLabels[test.type] ?? test.type}</Badge>
                    {isCompletedTab ? (
                      <Badge variant="outline" className="gap-1 text-green-700 border-green-300">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </Badge>
                    ) : (
                      <Badge variant="outline">{test.requiredPlan}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-2">{test.title}</CardTitle>
                  <CardDescription className="flex gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <FileQuestion className="h-4 w-4" /> {test.totalQuestions} Q
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />{' '}
                      {test.durationMinutes > 0 ? `${test.durationMinutes} min` : 'No timer'}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isCompletedTab && test.userResult ? (
                    <>
                      <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm dark:bg-green-950/30">
                        <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>
                          Score: <strong>{test.userResult.score}/{test.userResult.maxScore}</strong>
                          {' '}({formatPercent(test.userResult.percentage)})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        Completed on{' '}
                        {new Date(test.userResult.completedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <Link href={`/results/${test.userResult.resultId}`}>
                        <Button className="w-full" variant="secondary">View Result</Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">Total marks: {test.totalMarks}</p>
                      <Link href={`/tests/${test._id}/attempt`}>
                        <Button className="w-full">Start Test</Button>
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {!tests.length && (
            <p className="text-center text-muted-foreground py-12">
              {isCompletedTab
                ? 'No completed tests yet. Finish a mock test to see it here.'
                : 'No tests available. Check back soon!'}
            </p>
          )}

          <Pagination meta={meta} onPageChange={setPage} disabled={loading} />
        </>
      )}
    </div>
  );
}
