'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ListSkeleton } from '@/components/ui/page-skeletons';
import { Pagination, type PaginationMeta } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiSuccess } from '@/lib/api';
import { cn } from '@/lib/utils';

type FeedbackStatus = 'new' | 'reviewed' | 'resolved';
type FeedbackCategory = 'bug' | 'improvement' | 'feature' | 'other';

type FeedbackUser = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
};

type FeedbackItem = {
  _id: string;
  userId: FeedbackUser;
  category: FeedbackCategory;
  subject: string;
  message: string;
  pageUrl?: string;
  status: FeedbackStatus;
  adminNote?: string;
  createdAt: string;
};

type FeedbackStats = {
  new: number;
  reviewed: number;
  resolved: number;
  total: number;
};

const categoryLabels: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  improvement: 'Improvement',
  feature: 'Feature',
  other: 'Other',
};

const statusLabels: Record<FeedbackStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
};

const statusColors: Record<FeedbackStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
};

const PAGE_SIZE = 10;

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>('');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => items.find((i) => i._id === selectedId),
    [items, selectedId]
  );

  async function loadData(filter: FeedbackStatus | 'all', pageNum = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
      if (filter !== 'all') params.set('status', filter);
      const [listRes, statsRes] = await Promise.all([
        api<ApiSuccess<FeedbackItem[]>>(`/admin/feedback?${params.toString()}`),
        api<ApiSuccess<FeedbackStats>>('/admin/feedback/stats'),
      ]);
      setItems(listRes.data);
      if (listRes.meta) setMeta(listRes.meta);
      setStats(statsRes.data);
      setSelectedId((prev) => {
        if (prev && listRes.data.some((i) => i._id === prev)) return prev;
        return listRes.data[0]?._id ?? '';
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    loadData(statusFilter, page);
  }, [statusFilter, page]);

  useEffect(() => {
    setAdminNote(selected?.adminNote ?? '');
  }, [selectedId, selected?.adminNote]);

  async function updateStatus(status: FeedbackStatus) {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await api<ApiSuccess<FeedbackItem>>(`/admin/feedback/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNote: adminNote.trim() || undefined }),
      });
      setItems((prev) => prev.map((i) => (i._id === selectedId ? res.data : i)));
      const statsRes = await api<ApiSuccess<FeedbackStats>>('/admin/feedback/stats');
      setStats(statsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function saveNote() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await api<ApiSuccess<FeedbackItem>>(`/admin/feedback/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify({ adminNote: adminNote.trim() || undefined }),
      });
      setItems((prev) => prev.map((i) => (i._id === selectedId ? res.data : i)));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">MentorsDaily ExamPrep Pro</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Student Feedback</h1>
        <p className="mt-1 text-muted-foreground">
          Students ke bugs, suggestions aur improvement requests yahan dikhenge.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: stats.total, key: 'all' as const },
            { label: 'New', value: stats.new, key: 'new' as const },
            { label: 'Reviewed', value: stats.reviewed, key: 'reviewed' as const },
            { label: 'Resolved', value: stats.resolved, key: 'resolved' as const },
          ].map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStatusFilter(s.key)}
              className={cn(
                'rounded-lg border p-4 text-left transition-colors',
                statusFilter === s.key ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              )}
            >
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Feedback List
            </CardTitle>
            <CardDescription>
              {statusFilter === 'all' ? 'All feedback' : `Status: ${statusLabels[statusFilter]}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[520px] space-y-2 overflow-y-auto">
            {loading ? (
              <ListSkeleton count={5} />
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Abhi koi feedback nahi aaya.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setSelectedId(item._id)}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors',
                    selectedId === item._id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium line-clamp-1">{item.subject}</p>
                    <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium', statusColors[item.status])}>
                      {statusLabels[item.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.userId?.name ?? 'Unknown'} · {categoryLabels[item.category]}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString('en-IN')}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback Detail
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-muted-foreground">Detail dekhne ke liye koi feedback select karein.</p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{categoryLabels[selected.category]}</Badge>
                  <span className={cn('rounded px-2 py-0.5 text-xs font-medium', statusColors[selected.status])}>
                    {statusLabels[selected.status]}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">{selected.subject}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{selected.message}</p>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p><span className="font-medium">Student:</span> {selected.userId?.name}</p>
                  <p><span className="font-medium">Email:</span> {selected.userId?.email}</p>
                  {selected.userId?.phone && (
                    <p><span className="font-medium">Phone:</span> {selected.userId.phone}</p>
                  )}
                  {selected.pageUrl && (
                    <p className="mt-1 break-all"><span className="font-medium">Page:</span> {selected.pageUrl}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted: {new Date(selected.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Admin Note (internal)</label>
                  <textarea
                    className="mt-1 min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Internal note — student ko nahi dikhega"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                  <Button size="sm" variant="outline" className="mt-2" onClick={saveNote} disabled={saving}>
                    Save Note
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['new', 'reviewed', 'resolved'] as FeedbackStatus[]).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selected.status === s ? 'default' : 'outline'}
                      onClick={() => updateStatus(s)}
                      disabled={saving || selected.status === s}
                    >
                      Mark {statusLabels[s]}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Pagination meta={meta} onPageChange={setPage} disabled={loading} />
    </div>
  );
}
