'use client';

import { useEffect, useState } from 'react';
import { Calendar, Loader2, Trash2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExamSelect } from '@/components/admin/ExamSelect';
import {
  useTestBuilderSubjects,
  useBankAvailability,
  useCreateTestFromBank,
  useAdminMocks,
  useDeleteAdminMock,
  useExamPattern,
} from '@/hooks/use-test-builder';
import { cn } from '@/lib/utils';

const MOCK_TYPES = [
  { id: 'full_length' as const, label: 'Full Length', hint: 'Official pattern' },
  { id: 'subject_test' as const, label: 'Subject Test', hint: 'One subject' },
  { id: 'practice_set' as const, label: 'Practice Set', hint: '20 Q, no timer' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy' as const, label: 'Easy' },
  { value: 'medium' as const, label: 'Moderate' },
  { value: 'hard' as const, label: 'Hard' },
  { value: 'mixed' as const, label: 'Mixed' },
];

function formatDateTime(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function RadioOption({
  checked,
  onChange,
  label,
  hint,
  name,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
  name: string;
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm transition-colors',
        checked ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border hover:bg-muted/40'
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="accent-primary h-3.5 w-3.5" />
      <span>{label}</span>
      {hint && <span className="text-[10px] text-muted-foreground hidden sm:inline">({hint})</span>}
    </label>
  );
}

export default function ScheduleMockPage() {
  const [examId, setExamId] = useState('');
  const [mockType, setMockType] = useState<'full_length' | 'subject_test' | 'practice_set'>('full_length');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
  const [title, setTitle] = useState('');
  const [avoidReuse, setAvoidReuse] = useState(true);
  const [scheduledAt, setScheduledAt] = useState('');
  const [message, setMessage] = useState('');
  const [showMocks, setShowMocks] = useState(false);

  const [filterExamId, setFilterExamId] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const { data: subjectData } = useTestBuilderSubjects(examId || undefined);
  const { data: patternData } = useExamPattern(
    examId || undefined,
    mockType,
    mockType === 'subject_test' ? selectedSubject : undefined
  );
  const pattern = patternData?.pattern;

  const subjectsForAvailability =
    mockType === 'subject_test' && selectedSubject
      ? [selectedSubject]
      : pattern?.subjects ?? subjectData?.subjects;

  const { data: availability } = useBankAvailability(
    examId || undefined,
    subjectsForAvailability,
    difficulty,
    avoidReuse
  );
  const { data: mocksData, isLoading: mocksLoading } = useAdminMocks({
    examId: filterExamId || undefined,
    search: filterSearch || undefined,
  });
  const createTest = useCreateTestFromBank();
  const deleteMock = useDeleteAdminMock();

  const subjects = subjectData?.subjects ?? [];
  const mocks = mocksData?.mocks ?? [];

  useEffect(() => {
    if (mockType === 'full_length') setSelectedSubject('');
  }, [mockType]);

  async function handleCreate(schedule: boolean) {
    if (!examId) { setMessage('Pehle exam select karo'); return; }
    if (mockType === 'subject_test' && !selectedSubject) {
      setMessage('Subject select karo'); return;
    }
    if (schedule && !scheduledAt) { setMessage('Date & time set karo'); return; }
    setMessage('');
    try {
      const res = await createTest.mutateAsync({
        examId,
        subjects: mockType === 'subject_test' ? [selectedSubject] : undefined,
        difficulty,
        mockType,
        avoidReuse,
        autoGenerate: true,
        title: title.trim() || undefined,
        scheduledAt: schedule ? new Date(scheduledAt).toISOString() : undefined,
      });
      setMessage(res.data.message);
      if (schedule) { setScheduledAt(''); setTitle(''); }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <div className="p-4 md:p-5 max-w-3xl mx-auto space-y-4">
      {/* Header — compact */}
      <div>
        <h1 className="text-lg font-bold">Schedule Mock</h1>
        <p className="text-xs text-muted-foreground">
          Exam select karo — pattern auto load. Manual setup nahi chahiye.
        </p>
      </div>

      {/* Main form card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Exam + Test name — 2 col */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Exam</label>
              <ExamSelect
                value={examId}
                onChange={(id) => { setExamId(id); setSelectedSubject(''); }}
                className="mt-0.5 h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Test Name (optional)</label>
              <Input
                className="mt-0.5 h-9 text-sm"
                placeholder={`${patternData?.examName ?? 'Exam'} Mock`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Pattern strip — one line */}
          {pattern && (
            <div className="rounded-md bg-muted/50 border px-3 py-2 text-xs space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-foreground">{patternData?.examName}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{pattern.totalQuestions} Q</Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{pattern.totalMarks} M</Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {pattern.hasTimer ? `${pattern.durationMinutes}m` : 'No timer'}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {pattern.negativeMarkingLabel}
                </Badge>
                {availability && (
                  <span className="text-muted-foreground ml-auto">
                    {availability.total} in bank
                    {availability.total < pattern.totalQuestions && ' · auto-gen rest'}
                  </span>
                )}
              </div>
              {pattern.sections.length > 0 && (
                <p className="text-muted-foreground leading-snug">
                  {pattern.sections.map((s) => `${s.name} ${s.questionCount}`).join(' · ')}
                </p>
              )}
            </div>
          )}

          {/* Mock Type — horizontal radios */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Mock Type</label>
            <div className="flex flex-wrap gap-2">
              {MOCK_TYPES.map((t) => (
                <RadioOption
                  key={t.id}
                  name="mockType"
                  label={t.label}
                  hint={t.hint}
                  checked={mockType === t.id}
                  onChange={() => setMockType(t.id)}
                />
              ))}
            </div>
          </div>

          {/* Subject — radio chip grid (only for subject test) */}
          {mockType === 'subject_test' && subjects.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {subjects.map((s) => {
                  const count = subjectData?.sections?.find((sec) => sec.name === s)?.questionCount;
                  return (
                    <label
                      key={s}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1.5 rounded-md border cursor-pointer text-xs transition-colors',
                        selectedSubject === s
                          ? 'border-primary bg-primary/5 font-medium'
                          : 'border-border hover:bg-muted/40'
                      )}
                    >
                      <input
                        type="radio"
                        name="subject"
                        checked={selectedSubject === s}
                        onChange={() => setSelectedSubject(s)}
                        className="accent-primary h-3 w-3 shrink-0"
                      />
                      <span className="truncate">{s}</span>
                      {count && <span className="text-muted-foreground">({count})</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Difficulty + checkbox — inline row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Difficulty</label>
              <select
                className="h-8 rounded-md border bg-background px-2 text-xs"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              >
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={avoidReuse}
                onChange={(e) => setAvoidReuse(e.target.checked)}
                className="rounded h-3.5 w-3.5 accent-primary"
              />
              Avoid reused questions
            </label>
          </div>

          {/* Schedule + actions — one row */}
          <div className="flex flex-wrap items-end gap-2 pt-1">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-0.5">
                <Calendar className="h-3 w-3" /> Date & time (schedule)
              </label>
              <Input
                type="datetime-local"
                className="h-9 text-sm"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="h-9 px-4"
              onClick={() => handleCreate(true)}
              disabled={createTest.isPending || !examId || !scheduledAt}
            >
              {createTest.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Schedule Mock'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4"
              onClick={() => handleCreate(false)}
              disabled={createTest.isPending || !examId}
            >
              Publish Now
            </Button>
          </div>

          {message && (
            <p className={cn(
              'text-xs px-2 py-1.5 rounded',
              message.includes('failed') || message.includes('select') || message.includes('Pehle') || message.includes('set karo')
                ? 'bg-destructive/10 text-destructive'
                : 'bg-green-50 text-green-700'
            )}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mocks list — collapsible, compact */}
      <div>
        <button
          type="button"
          onClick={() => setShowMocks((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors"
        >
          Scheduled & Live Mocks
          <Badge variant="secondary" className="text-[10px]">{mocks.length}</Badge>
          <span className="text-xs text-muted-foreground font-normal">{showMocks ? '▲ hide' : '▼ show'}</span>
        </button>

        {showMocks && (
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              <ExamSelect
                value={filterExamId}
                onChange={setFilterExamId}
                placeholder="All exams"
                className="h-8 text-xs w-40"
              />
              <Input
                className="h-8 text-xs flex-1 min-w-[120px]"
                placeholder="Search..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
            </div>

            {mocksLoading ? (
              <p className="text-xs text-muted-foreground">Loading...</p>
            ) : mocks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">No mocks yet</p>
            ) : (
              <div className="border rounded-md divide-y text-xs">
                {mocks.map((mock) => {
                  const isLive = mock.status === 'published' && mock.isLive;
                  const isScheduled = mock.type === 'job' || mock.status === 'scheduled';
                  return (
                    <div key={`${mock.type}-${mock.id}`} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate">{mock.title}</span>
                          {isLive && <Badge className="text-[9px] px-1 py-0 bg-green-600">Live</Badge>}
                          {isScheduled && !isLive && <Badge variant="secondary" className="text-[9px] px-1 py-0">Scheduled</Badge>}
                        </div>
                        <p className="text-muted-foreground truncate">
                          {mock.examName} · {mock.totalQuestions}Q ·{' '}
                          {mock.durationMinutes > 0 ? `${mock.durationMinutes}m` : 'No timer'}
                          {isLive && ` · ${mock.attemptCount} attempts`}
                        </p>
                      </div>
                      <span className="text-muted-foreground whitespace-nowrap hidden sm:block">
                        <Clock className="h-3 w-3 inline mr-0.5" />
                        {formatDateTime(mock.scheduledAt ?? mock.publishedAt ?? mock.createdAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive shrink-0"
                        onClick={() => {
                          if (!confirm('Delete?')) return;
                          deleteMock.mutate({ id: mock.id, type: mock.type });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
