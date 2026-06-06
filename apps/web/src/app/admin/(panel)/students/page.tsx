'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, User, Calendar, BookOpen, KeyRound, Eye, EyeOff, Trash2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, ApiSuccess } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/page-skeletons';
import { Pagination, type PaginationMeta } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminExams } from '@/hooks/use-exam-management';
import { cn } from '@/lib/utils';

type Student = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  selectedExamSlugs?: string[];
  isBanned?: boolean;
  createdAt?: string;
  subscriptionPlan?: string;
  adminVisiblePassword?: string;
};

const PAGE_SIZE = 15;

export default function AdminStudentsPage() {
  const { data: exams, isLoading: examsLoading } = useAdminExams();
  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const selectedStudent = students.find((s) => s._id === selectedStudentId);

  const [selectedExamSlugs, setSelectedExamSlugs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function loadStudents(pageNum = page) {
    setLoadingStudents(true);
    try {
      const res = await api<ApiSuccess<Student[]>>(`/admin/students?page=${pageNum}&limit=${PAGE_SIZE}`);
      setStudents(res.data);
      if (res.meta) setMeta(res.meta);
      setSelectedStudentId((prev) => {
        if (prev && res.data.some((s) => s._id === prev)) return prev;
        return res.data[0]?._id ?? '';
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStudents(false);
    }
  }

  useEffect(() => {
    loadStudents(page);
  }, [page]);

  useEffect(() => {
    setSelectedExamSlugs(selectedStudent?.selectedExamSlugs ?? []);
    setShowPassword(false);
    setNewPassword('');
  }, [selectedStudentId]);

  useEffect(() => {
    if (!selectedStudentId) return;

    setLoadingDetail(true);
    api<ApiSuccess<Student>>(`/admin/students/${selectedStudentId}`)
      .then((res) => {
        setStudents((prev) =>
          prev.map((s) => (s._id === selectedStudentId ? { ...s, ...res.data } : s))
        );
      })
      .catch(console.error)
      .finally(() => setLoadingDetail(false));
  }, [selectedStudentId]);

  const groupedExams = useMemo(() => {
    const map = new Map<string, typeof exams>();
    for (const ex of exams ?? []) {
      const key = ex.categoryId?.slug ?? 'uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ex);
    }
    return Array.from(map.entries()).map(([categorySlug, list]) => ({
      categorySlug,
      categoryName: list?.[0]?.categoryId?.name ?? categorySlug,
      exams: list ?? [],
    }));
  }, [exams]);

  function toggleExam(slug: string) {
    setSelectedExamSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  async function handleSave() {
    if (!selectedStudentId) return;
    if (!selectedExamSlugs.length) {
      setMessage('Select at least one exam');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await api(`/admin/students/${selectedStudentId}/exams`, {
        method: 'PATCH',
        body: JSON.stringify({ examSlugs: selectedExamSlugs }),
      });

      setStudents((prev) =>
        prev.map((s) =>
          s._id === selectedStudentId ? { ...s, selectedExamSlugs: selectedExamSlugs } : s
        )
      );
      setMessage('Student exams updated successfully');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to update student exams');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!selectedStudentId) return;
    setResettingPassword(true);
    setMessage('');
    try {
      const res = await api<ApiSuccess<{ password: string }>>(
        `/admin/students/${selectedStudentId}/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify(newPassword.trim() ? { password: newPassword.trim() } : {}),
        }
      );
      setStudents((prev) =>
        prev.map((s) =>
          s._id === selectedStudentId
            ? { ...s, adminVisiblePassword: res.data.password }
            : s
        )
      );
      setNewPassword('');
      setShowPassword(true);
      setMessage(`Password reset. New password: ${res.data.password}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  }

  async function handleDeleteStudent() {
    if (!selectedStudent) return;
    const confirmed = window.confirm(
      `Delete ${selectedStudent.name}? This will remove their account, test history, and payments permanently.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setMessage('');
    try {
      await api(`/admin/students/${selectedStudentId}`, { method: 'DELETE' });
      const remaining = students.filter((s) => s._id !== selectedStudentId);
      setStudents(remaining);
      setSelectedStudentId(remaining[0]?._id ?? '');
      setMessage('Student account deleted');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(value?: string) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div className="overflow-x-hidden space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <p className="text-sm font-medium text-primary">MentorsDaily ExamPrep Pro</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Students</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View registered students and assign exams
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Students</CardTitle>
          <CardDescription>
            {loadingStudents
              ? 'Loading students...'
              : meta.total
                ? `${meta.total} student(s) registered`
                : 'No students registered yet. New sign-ups will appear here.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStudents ? (
            <TableSkeleton rows={8} cols={6} />
          ) : students.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <User className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No students yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                When students register from the login page, their details will show here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-max w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Registered</th>
                    <th className="px-3 py-2 font-medium">Plan</th>
                    <th className="px-3 py-2 font-medium">Exams</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr
                      key={student._id}
                      className={cn(
                        'border-b cursor-pointer transition-colors hover:bg-muted/50',
                        selectedStudentId === student._id && 'bg-primary/5'
                      )}
                      onClick={() => setSelectedStudentId(student._id)}
                    >
                      <td className="px-3 py-3 font-medium">{student.name}</td>
                      <td className="px-3 py-3">{student.email}</td>
                      <td className="px-3 py-3">{formatDate(student.createdAt)}</td>
                      <td className="px-3 py-3 capitalize">{student.subscriptionPlan ?? 'free'}</td>
                      <td className="px-3 py-3">
                        {student.selectedExamSlugs?.length ? (
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            {student.selectedExamSlugs.length}
                          </span>
                        ) : (
                          'None'
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {student.isBanned ? (
                          <Badge variant="warning">Banned</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loadingStudents && students.length > 0 && (
            <Pagination meta={meta} onPageChange={setPage} disabled={loadingStudents} className="mt-4" />
          )}
        </CardContent>
      </Card>

      {students.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
              <CardDescription>Select a student to view details and assign exams</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                className="w-full rounded-md border bg-background px-3 py-2.5 text-sm"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>

              {selectedStudent && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedStudent.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {selectedStudent.email}
                  </div>
                  {selectedStudent.phone ? (
                    <div className="text-sm text-muted-foreground">Phone: {selectedStudent.phone}</div>
                  ) : null}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(selectedStudent.createdAt)}
                  </div>
                  <div className="rounded-md border bg-background p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <KeyRound className="h-4 w-4 text-primary" />
                        Password
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {loadingDetail ? (
                      <Skeleton className="h-4 w-32" />
                    ) : (
                      <p className="font-mono text-sm">
                        {showPassword
                          ? selectedStudent.adminVisiblePassword || 'Not saved — use Reset Password'
                          : '••••••••'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <label className="text-sm font-medium">Reset Password</label>
                    <Input
                      type="text"
                      placeholder="Leave empty to auto-generate"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-[44px] w-full gap-2"
                      onClick={handleResetPassword}
                      disabled={resettingPassword || !selectedStudentId}
                    >
                      <RotateCcw className="h-4 w-4" />
                      {resettingPassword ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    className="min-h-[44px] w-full gap-2"
                    onClick={handleDeleteStudent}
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </div>
              )}

              {selectedStudent?.selectedExamSlugs?.length ? (
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.selectedExamSlugs.map((slug) => (
                    <Badge key={slug} variant="secondary">
                      {slug}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No exams assigned yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pick Exams</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {examsLoading ? (
                <p className="text-sm text-muted-foreground">Loading exams...</p>
              ) : !exams?.length ? (
                <p className="text-sm text-muted-foreground">No exams found. Create exams first.</p>
              ) : (
                <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-2">
                  {groupedExams.map((g) => (
                    <div key={g.categorySlug} className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{g.categoryName}</p>
                      <div className="flex flex-wrap gap-2">
                        {g.exams.map((ex) => {
                          const active = selectedExamSlugs.includes(ex.slug);
                          return (
                            <button
                              type="button"
                              key={ex._id}
                              className={cn(
                                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                                active
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'bg-background hover:bg-muted'
                              )}
                              onClick={() => toggleExam(ex.slug)}
                            >
                              {ex.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="min-h-[44px]"
                  onClick={handleSave}
                  disabled={saving || examsLoading || !selectedStudentId}
                >
                  {saving ? 'Saving...' : 'Save for Student'}
                </Button>
                {message ? (
                  <span
                    className={cn(
                      'text-sm',
                      message.includes('success') || message.includes('reset') || message.includes('deleted')
                        ? 'text-green-600'
                        : 'text-destructive'
                    )}
                  >
                    {message}
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
