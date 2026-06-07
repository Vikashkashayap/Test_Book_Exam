'use client';

import { useState } from 'react';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExamSelect } from '@/components/admin/ExamSelect';
import {
  useAdminPyqPdfs,
  useUploadPyqPdf,
  useUpdatePyqPdf,
  useDeletePyqPdf,
  uploadPyqPdfFile,
  type AdminPyqPdfRow,
} from '@/hooks/use-pyq-admin';

export default function AdminPyqPage() {
  const { data: papers, isLoading } = useAdminPyqPdfs();
  const uploadPyq = useUploadPyqPdf();
  const updatePyq = useUpdatePyqPdf();
  const deletePyq = useDeletePyqPdf();

  const [examId, setExamId] = useState('');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const [description, setDescription] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!examId || !title.trim() || !pdfFile) {
      setMessage('Exam, title, and PDF file are required');
      return;
    }

    setUploading(true);
    try {
      const fileUrl = await uploadPyqPdfFile(pdfFile);
      await uploadPyq.mutateAsync({
        examId,
        title: title.trim(),
        year: Number(year),
        description: description.trim() || undefined,
        fileUrl,
      });
      setMessage('PYQ PDF uploaded. It will appear on /pyq page year-wise.');
      setTitle('');
      setDescription('');
      setPdfFile(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to upload PYQ PDF');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deletePyq.mutateAsync(id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to delete paper');
    }
  }

  const groupedByYear = (papers ?? []).reduce<Record<string, AdminPyqPdfRow[]>>((acc, paper) => {
    const key = paper.year ? String(paper.year) : 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(paper);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return Number(b) - Number(a);
  });

  return (
    <div className="space-y-6 overflow-x-hidden p-4 sm:p-6 md:p-8">
      <div>
        <p className="text-sm font-medium text-primary">MentorsDaily ExamPrep Pro</p>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <FileText className="h-7 w-7 text-primary" />
          PYQ PDF Upload
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload previous year PDF papers — they appear on the{' '}
          <a href="/pyq" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            /pyq
          </a>{' '}
          page sorted by year
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload PYQ PDF</CardTitle>
            <CardDescription>Select exam, year, and upload the question paper PDF</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Exam</label>
                <ExamSelect value={examId} onChange={setExamId} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Paper Title</label>
                <Input
                  className="mt-1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="SSC CGL Tier-1 2023 Shift 1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Year</label>
                <Input
                  className="mt-1"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  className="mt-1"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Shift 1 Morning Session"
                />
              </div>
              <div>
                <label className="text-sm font-medium">PDF File</label>
                <Input
                  className="mt-1"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <Button type="submit" disabled={uploading || uploadPyq.isPending} className="w-full sm:w-auto">
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Upload PDF
                  </>
                )}
              </Button>
              {message && <p className="text-sm text-muted-foreground">{message}</p>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uploaded Papers (Year-wise)</CardTitle>
            <CardDescription>Toggle visibility on the public PYQ page</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </p>
            ) : !papers?.length ? (
              <p className="text-sm text-muted-foreground">No PYQ PDFs uploaded yet.</p>
            ) : (
              <div className="space-y-6">
                {sortedYears.map((yearKey) => (
                  <div key={yearKey}>
                    <h3 className="mb-2 flex items-center gap-2 font-semibold">
                      {yearKey === 'Other' ? 'Other' : yearKey}
                      <Badge variant="secondary">{groupedByYear[yearKey]?.length ?? 0}</Badge>
                    </h3>
                    <ul className="space-y-2">
                      {groupedByYear[yearKey]?.map((paper) => (
                        <li key={paper._id} className="rounded-lg border p-3 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{paper.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {paper.examId?.name ?? paper.examSlug}
                              </p>
                            </div>
                            <Badge variant={paper.isActive ? 'default' : 'secondary'}>
                              {paper.isActive ? 'Live' : 'Hidden'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline">
                                View PDF
                              </Button>
                            </a>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updatePyq.mutate({
                                  id: paper._id,
                                  isActive: !paper.isActive,
                                })
                              }
                              disabled={updatePyq.isPending}
                            >
                              {paper.isActive ? 'Hide' : 'Publish'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(paper._id, paper.title)}
                              disabled={deletePyq.isPending}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
