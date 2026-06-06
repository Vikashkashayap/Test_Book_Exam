'use client';

import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListSkeleton } from '@/components/ui/page-skeletons';
import { Pagination, type PaginationMeta } from '@/components/ui/pagination';
import { api, ApiSuccess } from '@/lib/api';

interface BookmarkItem {
  _id: string;
  note?: string;
  questionId: { text: string; type: string };
}

const PAGE_SIZE = 10;

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api<ApiSuccess<BookmarkItem[]>>(`/bookmarks?page=${page}&limit=${PAGE_SIZE}`)
      .then((res) => {
        setBookmarks(res.data);
        if (res.meta) setMeta(res.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Bookmark className="h-8 w-8" /> Saved Questions
      </h1>

      {loading ? (
        <ListSkeleton count={5} />
      ) : (
        <>
          <div className="space-y-4 max-w-3xl">
            {bookmarks.map((b) => (
              <Card key={b._id}>
                <CardHeader>
                  <CardTitle className="text-base font-normal">{b.questionId?.text}</CardTitle>
                </CardHeader>
                {b.note && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground italic">Note: {b.note}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
          {!bookmarks.length && <p className="text-muted-foreground">No bookmarked questions yet.</p>}
          <Pagination meta={meta} onPageChange={setPage} disabled={loading} />
        </>
      )}
    </div>
  );
}
