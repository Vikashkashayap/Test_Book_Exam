'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, Trophy, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ListSkeleton, TableSkeleton } from '@/components/ui/page-skeletons';
import { Pagination, type PaginationMeta } from '@/components/ui/pagination';
import { api, ApiSuccess } from '@/lib/api';
import { formatPercent } from '@/lib/utils';

type HistoryItem = {
  _id: string;
  score: number;
  maxScore: number;
  percentage: number;
  rank?: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  totalTimeSeconds: number;
  createdAt: string;
  testId?: { title: string; type?: string };
};

const typeLabels: Record<string, string> = {
  full_length: 'Full Length',
  subject_wise: 'Subject Test',
  practice_set: 'Practice Set',
  topic_wise: 'Topic Wise',
  daily_quiz: 'Daily Quiz',
  previous_year: 'Previous Year',
};

const PAGE_SIZE = 10;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api<ApiSuccess<HistoryItem[]>>(`/tests/results/me?page=${page}&limit=${PAGE_SIZE}`)
      .then((res) => {
        setItems(res.data ?? []);
        if (res.meta) setMeta(res.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="overflow-x-hidden space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <History className="h-7 w-7 text-primary" />
          Test History
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          All your submitted mock tests and practice sets
        </p>
      </div>

      {loading ? (
        <>
          <TableSkeleton rows={6} cols={6} />
          <ListSkeleton count={4} />
        </>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 font-medium">No test history yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete a mock test to see your results here.
            </p>
            <Link href="/tests" className="mt-6 inline-block">
              <Button>Browse Tests</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Test</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Rank</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{item.testId?.title ?? 'Test'}</td>
                    <td className="px-4 py-3">
                      {item.testId?.type ? (
                        <Badge variant="secondary">
                          {typeLabels[item.testId.type] ?? item.testId.type}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.score}/{item.maxScore}{' '}
                      <span className="text-muted-foreground">({formatPercent(item.percentage)})</span>
                    </td>
                    <td className="px-4 py-3">
                      {item.rank ? (
                        <span className="inline-flex items-center gap-1">
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />#{item.rank}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/results/${item._id}`}>
                        <Button size="sm" variant="outline">
                          View Result
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <Link key={item._id} href={`/results/${item._id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.testId?.title ?? 'Test'}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {item.testId?.type && (
                          <Badge variant="secondary" className="text-[10px]">
                            {typeLabels[item.testId.type] ?? item.testId.type}
                          </Badge>
                        )}
                        <span>
                          {item.score}/{item.maxScore} · {formatPercent(item.percentage)}
                        </span>
                        {item.rank ? <span>· Rank #{item.rank}</span> : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Pagination meta={meta} onPageChange={setPage} disabled={loading} />
        </>
      )}
    </div>
  );
}
