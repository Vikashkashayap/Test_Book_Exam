'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  Info,
  LayoutGrid,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, ApiSuccess } from '@/lib/api';
import { useTestAttemptStore, type TestMeta } from '@/store/test-attempt.store';
import { BilingualText } from '@/components/test/BilingualText';
import { QuestionPalette } from '@/components/test/QuestionPalette';
import { SubmitTestDialog } from '@/components/test/SubmitTestDialog';
import { TestTimer } from '@/components/test/TestTimer';
import { cn } from '@/lib/utils';

type StartAttemptData = {
  _id: string;
  answers: { questionId: string; answer: unknown; status: string; timeSpentSeconds: number }[];
  timeRemainingSeconds: number;
  testMeta?: TestMeta;
};

type QuestionsData = {
  questions: {
    _id: string;
    type: string;
    text: string;
    textHi?: string;
    options: { id: string; text: string; textHi?: string }[];
    marks: number;
    negativeMarks: number;
  }[];
};

export default function AttemptTestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const {
    attemptId,
    questions,
    answers,
    currentIndex,
    timeRemainingSeconds,
    negativeMarking,
    hasTimer,
    testMeta,
    initAttempt,
    setAnswer,
    markForReview,
    goToQuestion,
    next,
    previous,
    tick,
    toggleFullScreen,
    reset,
  } = useTestAttemptStore();

  const loadAttempt = useCallback(async () => {
    try {
      const startRes = await api<ApiSuccess<StartAttemptData>>(`/tests/${id}/start`, {
        method: 'POST',
      });
      const attempt = startRes.data;
      const meta = attempt.testMeta;

      const qRes = await api<ApiSuccess<QuestionsData>>(
        `/tests/attempts/${attempt._id}/questions`
      );

      initAttempt({
        attemptId: attempt._id,
        testId: id,
        questions: qRes.data.questions,
        answers: attempt.answers.map((a) => ({
          questionId: a.questionId,
          answer: a.answer as string | null,
          status: a.status as 'not_answered',
          timeSpentSeconds: a.timeSpentSeconds,
        })),
        timeRemainingSeconds:
          attempt.timeRemainingSeconds ??
          (meta?.durationMinutes ? meta.durationMinutes * 60 : 0),
        negativeMarking: meta?.negativeMarking ?? true,
        hasTimer: meta?.hasTimer ?? (meta?.durationMinutes ?? 0) > 0,
        testMeta: meta ?? null,
      });
    } catch (e) {
      console.error(e);
      router.push('/tests');
    } finally {
      setLoading(false);
    }
  }, [id, initAttempt, router]);

  useEffect(() => {
    loadAttempt();
    return () => reset();
  }, [loadAttempt, reset]);

  useEffect(() => {
    if (!paletteOpen && !showSubmitDialog) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSubmitDialog && !submitting) setShowSubmitDialog(false);
        else setPaletteOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [paletteOpen, showSubmitDialog, submitting]);

  const currentQ = questions[currentIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQ?._id);

  async function persistAnswer(answer: unknown, status?: string) {
    if (!attemptId || !currentQ) return;
    setAnswer(currentQ._id, answer, status as 'answered');
    await api(`/tests/attempts/${attemptId}/answer`, {
      method: 'PATCH',
      body: JSON.stringify({
        questionId: currentQ._id,
        answer,
        status: status ?? 'answered',
        currentQuestionIndex: currentIndex,
        timeRemainingSeconds,
      }),
    }).catch(console.error);
  }

  function requestSubmit() {
    if (!attemptId || submitting) return;
    setShowSubmitDialog(true);
  }

  async function handleSubmit(auto = false) {
    if (!attemptId || submitting) return;
    setShowSubmitDialog(false);
    setSubmitting(true);
    try {
      const res = await api<ApiSuccess<{ _id: string }>>(`/tests/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ autoSubmit: auto }),
      });
      reset();
      router.push(`/results/${res.data._id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  const handleExpire = useCallback(() => {
    if (hasTimer) handleSubmit(true);
  }, [hasTimer]);

  function handleGoToQuestion(index: number) {
    goToQuestion(index);
    setPaletteOpen(false);
  }

  if (loading || !currentQ) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center overflow-x-hidden px-4 text-sm md:text-base">
        Loading test...
      </div>
    );
  }

  const totalMarks = testMeta?.totalMarks ?? questions.reduce((s, q) => s + (q.marks || 1), 0);
  const answeredCount = answers.filter((a) => a.status === 'answered' || a.status === 'answered_marked').length;
  const markedCount = answers.filter((a) => a.status === 'marked_for_review' || a.status === 'answered_marked').length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-hidden bg-slate-50/80">
      {showInstructions && testMeta?.instructions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <Card className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-b-none sm:rounded-b-lg">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 shrink-0 text-primary" />
                <h2 className="text-base font-semibold md:text-lg">Exam Instructions</h2>
              </div>
              <p className="text-sm font-medium">{testMeta.title}</p>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
                {testMeta.instructions}
              </pre>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{testMeta.totalQuestions} Questions</Badge>
                <Badge variant="secondary">{totalMarks} Marks</Badge>
                {hasTimer ? (
                  <Badge variant="secondary">{testMeta.durationMinutes} min</Badge>
                ) : (
                  <Badge variant="outline">No timer</Badge>
                )}
                {negativeMarking ? (
                  <Badge variant="warning">Negative marking</Badge>
                ) : (
                  <Badge variant="outline">No negative</Badge>
                )}
              </div>
              <Button className="min-h-[44px] w-full" onClick={() => setShowInstructions(false)}>
                Start Test
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="flex items-center gap-3 px-3 py-2.5 sm:px-5 sm:py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 sm:text-[15px]">
              {testMeta?.title ?? `Question ${currentIndex + 1}`}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="font-medium text-primary">
                Q {currentIndex + 1}/{questions.length}
              </span>
              <span>·</span>
              <span>+{currentQ.marks} marks</span>
              {negativeMarking && currentQ.negativeMarks > 0 && (
                <>
                  <span>·</span>
                  <span className="text-destructive">−{currentQ.negativeMarks} wrong</span>
                </>
              )}
            </div>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <div className="flex items-center gap-1.5 rounded-lg border bg-slate-50 px-2.5 py-1 text-xs">
              <span className="font-medium text-emerald-600">{answeredCount}</span>
              <span className="text-muted-foreground">/{questions.length}</span>
            </div>
            {markedCount > 0 && (
              <Badge variant="warning" className="text-xs">
                {markedCount} marked
              </Badge>
            )}
          </div>

          <TestTimer
            seconds={timeRemainingSeconds}
            onExpire={handleExpire}
            onTick={tick}
            hasTimer={hasTimer}
            compact
          />

          <Button
            variant="outline"
            size="icon"
            className="hidden h-9 w-9 shrink-0 lg:inline-flex"
            onClick={toggleFullScreen}
            aria-label="Toggle fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="hidden h-9 shrink-0 sm:inline-flex"
            onClick={requestSubmit}
            disabled={submitting}
          >
            <Send className="h-3.5 w-3.5" />
            Submit
          </Button>
        </div>

        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={answeredCount}
            aria-valuemin={0}
            aria-valuemax={questions.length}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="mx-auto w-full max-w-2xl flex-1 px-3 py-4 pb-36 sm:px-5 sm:py-5 sm:pb-8 lg:max-w-3xl md:pb-6">
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="flex items-center justify-between border-b bg-slate-50/80 px-4 py-2.5 sm:px-5">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                  {currentIndex + 1}
                </span>
                Question {currentIndex + 1}
              </span>
              <span className="text-xs text-muted-foreground">
                {totalMarks} total marks
              </span>
            </div>
            <CardContent className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-5 sm:py-6">
              <BilingualText
                text={currentQ.text}
                textHi={currentQ.textHi}
                className="text-[15px] leading-relaxed text-slate-800 sm:text-base"
                hiClassName="text-[14px] leading-relaxed sm:text-[15px]"
              />

              {currentQ.type === 'single_mcq' && (
                <div className="space-y-2">
                  {currentQ.options.map((opt) => {
                    const selected = currentAnswer?.answer === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={cn(
                          'group flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-3 transition-all sm:px-4',
                          selected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white'
                        )}
                      >
                        <input
                          type="radio"
                          name="answer"
                          checked={selected}
                          onChange={() => persistAnswer(opt.id)}
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors',
                            selected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-white text-slate-500 ring-1 ring-slate-200 group-hover:ring-primary/40'
                          )}
                        >
                          {opt.id}
                        </span>
                        <BilingualText
                          text={opt.text}
                          textHi={opt.textHi}
                          className="text-sm leading-snug text-slate-700 sm:text-[15px]"
                          hiClassName="text-[13px] leading-snug sm:text-sm"
                        />
                      </label>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'multiple_mcq' && (
                <div className="space-y-2">
                  {currentQ.options.map((opt) => {
                    const selected =
                      Array.isArray(currentAnswer?.answer) && currentAnswer.answer.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className={cn(
                          'group flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-3 transition-all sm:px-4',
                          selected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => {
                            const prev = (
                              Array.isArray(currentAnswer?.answer) ? currentAnswer.answer : []
                            ) as string[];
                            const nextAns = selected
                              ? prev.filter((x) => x !== opt.id)
                              : [...prev, opt.id];
                            persistAnswer(nextAns);
                          }}
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors',
                            selected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-white text-slate-500 ring-1 ring-slate-200 group-hover:ring-primary/40'
                          )}
                        >
                          {opt.id}
                        </span>
                        <BilingualText
                          text={opt.text}
                          textHi={opt.textHi}
                          className="text-sm leading-snug text-slate-700 sm:text-[15px]"
                          hiClassName="text-[13px] leading-snug sm:text-sm"
                        />
                      </label>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'numerical' && (
                <input
                  type="number"
                  inputMode="decimal"
                  className="min-h-[44px] w-full max-w-xs rounded-md border px-4 py-2 text-base"
                  value={(currentAnswer?.answer as number) ?? ''}
                  onChange={(e) => persistAnswer(parseFloat(e.target.value) || e.target.value)}
                  placeholder="Enter numerical answer"
                  aria-label="Numerical answer"
                />
              )}
            </CardContent>
          </Card>

          <div className="mt-5 hidden items-center justify-between gap-3 rounded-xl border bg-white p-3 shadow-sm sm:mt-6 md:flex">
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1.5"
              onClick={previous}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1.5"
              onClick={() => {
                markForReview(currentQ._id);
                persistAnswer(currentAnswer?.answer, 'marked_for_review');
              }}
            >
              <Flag className="h-4 w-4" /> Mark for Review
            </Button>
            <Button
              size="sm"
              className="h-10 gap-1.5 px-5"
              onClick={async () => {
                if (currentIndex < questions.length - 1) next();
                else requestSubmit();
              }}
            >
              {currentIndex < questions.length - 1 ? (
                <>
                  Save & Next <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit Test
                </>
              )}
            </Button>
          </div>
        </main>

        <aside className="hidden w-64 shrink-0 border-l bg-white xl:w-72 md:block">
          <div className="sticky top-[4.5rem] flex max-h-[calc(100dvh-4.5rem)] flex-col">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">Question Palette</p>
              <div className="mt-1.5 flex gap-3 text-xs text-muted-foreground">
                <span>
                  <span className="font-semibold text-emerald-600">{answeredCount}</span> done
                </span>
                <span>
                  <span className="font-semibold text-amber-600">{markedCount}</span> marked
                </span>
                <span>
                  <span className="font-semibold">{questions.length - answeredCount}</span> left
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <QuestionPalette
                total={questions.length}
                currentIndex={currentIndex}
                getStatus={(i) => answers[i]?.status ?? 'not_answered'}
                onSelect={handleGoToQuestion}
              />
            </div>
            <div className="border-t p-3">
              <Button
                variant="destructive"
                size="sm"
                className="h-10 w-full gap-1.5"
                onClick={requestSubmit}
                disabled={submitting}
              >
                <Send className="h-3.5 w-3.5" />
                Submit Test
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile bottom navigation */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
        <div className="flex items-center gap-1.5 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Button
            variant="outline"
            size="sm"
            className="h-11 flex-1 gap-1"
            onClick={previous}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-11 flex-1 flex-col gap-0 px-1"
            onClick={() => setPaletteOpen(true)}
            aria-expanded={paletteOpen}
            aria-label="Open question palette"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold leading-none">
              {currentIndex + 1}/{questions.length}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-11 flex-1 gap-1"
            onClick={() => {
              markForReview(currentQ._id);
              persistAnswer(currentAnswer?.answer, 'marked_for_review');
            }}
          >
            <Flag className="h-3.5 w-3.5" />
            Mark
          </Button>
          <Button
            size="sm"
            className="h-11 flex-[1.2] gap-1"
            onClick={async () => {
              if (currentIndex < questions.length - 1) next();
              else requestSubmit();
            }}
          >
            {currentIndex < questions.length - 1 ? (
              <>
                Next <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" /> Submit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile question palette bottom sheet */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Question palette">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setPaletteOpen(false)}
            aria-label="Close question palette"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75dvh] overflow-hidden rounded-t-2xl border-t bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="font-semibold">Question Palette</p>
                <p className="text-xs text-muted-foreground">
                  {answeredCount} answered · {markedCount} marked · {questions.length - answeredCount} left
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={() => setPaletteOpen(false)}
                aria-label="Close palette"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
              <QuestionPalette
                total={questions.length}
                currentIndex={currentIndex}
                getStatus={(i) => answers[i]?.status ?? 'not_answered'}
                onSelect={handleGoToQuestion}
                compact
              />
              <div className="border-t px-4 py-3">
                <Button
                  variant="outline"
                  className="min-h-[44px] w-full"
                  onClick={() => {
                    markForReview(currentQ._id);
                    persistAnswer(currentAnswer?.answer, 'marked_for_review');
                  }}
                >
                  <Flag className="h-4 w-4" /> Mark Q{currentIndex + 1} for Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SubmitTestDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        onConfirm={() => handleSubmit()}
        submitting={submitting}
        answeredCount={answeredCount}
        totalQuestions={questions.length}
        markedCount={markedCount}
      />
    </div>
  );
}
