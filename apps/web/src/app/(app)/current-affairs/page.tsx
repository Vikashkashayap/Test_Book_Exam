'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListSkeleton } from '@/components/ui/page-skeletons';
import { Pagination, type PaginationMeta } from '@/components/ui/pagination';
import { api, ApiSuccess } from '@/lib/api';

interface Affair {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  category: string;
  publishedDate: string;
}

const PAGE_SIZE = 10;

export default function CurrentAffairsPage() {
  const [affairs, setAffairs] = useState<Affair[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const exam = searchParams.get('exam');

  useEffect(() => {
    setPage(1);
  }, [exam]);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (exam) qs.set('exam', exam);
    qs.set('page', String(page));
    qs.set('limit', String(PAGE_SIZE));

    api<ApiSuccess<Affair[]>>(`/content/current-affairs?${qs.toString()}`)
      .then((res) => {
        setAffairs(res.data);
        if (res.meta) setMeta(res.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [exam, page]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold">Current Affairs</h1>
      <p className="text-muted-foreground">Current affairs for your selected exams only</p>

      {loading ? (
        <ListSkeleton count={5} />
      ) : (
        <>
          <div className="space-y-4 max-w-3xl">
            {affairs.map((a) => (
              <Card key={a._id}>
                <CardHeader>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{a.category}</span>
                    <span>{new Date(a.publishedDate).toLocaleDateString()}</span>
                  </div>
                  <CardTitle className="text-lg">
                    <Link href={`/current-affairs/${a.slug}`} className="hover:text-primary">
                      {a.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                {a.summary && <CardContent><p className="text-sm text-muted-foreground">{a.summary}</p></CardContent>}
              </Card>
            ))}
          </div>
          {!affairs.length && <p className="text-muted-foreground">No current affairs published yet.</p>}
          <Pagination meta={meta} onPageChange={setPage} disabled={loading} />
        </>
      )}
    </div>
  );
}
