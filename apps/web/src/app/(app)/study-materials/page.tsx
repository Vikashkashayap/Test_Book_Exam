'use client';

import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardGridSkeleton } from '@/components/ui/page-skeletons';
import { Pagination, type PaginationMeta } from '@/components/ui/pagination';
import { api, ApiSuccess } from '@/lib/api';

interface Material {
  _id: string;
  title: string;
  type: string;
  fileUrl: string;
  requiredPlan: string;
}

const PAGE_SIZE = 12;

export default function StudyMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
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

    api<ApiSuccess<Material[]>>(`/content/study-materials?${qs.toString()}`)
      .then((res) => {
        setMaterials(res.data);
        if (res.meta) setMeta(res.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [exam, page]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold">Study Materials</h1>
      <p className="text-muted-foreground">Study materials for your selected exams only</p>

      {loading ? (
        <CardGridSkeleton count={6} cols="md:grid-cols-2 lg:grid-cols-3" />
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((m) => (
              <Card key={m._id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  <Badge variant="outline">{m.requiredPlan}</Badge>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base">{m.title}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize mt-1">{m.type.replace('_', ' ')}</p>
                  <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary mt-4 hover:underline">
                    <Download className="h-4 w-4" /> Download
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
          {!materials.length && <p className="text-muted-foreground">No materials uploaded yet.</p>}
          <Pagination meta={meta} onPageChange={setPage} disabled={loading} />
        </>
      )}
    </div>
  );
}
