'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BilingualText } from '@/components/test/BilingualText';
import { cn } from '@/lib/utils';

export interface QuestionReviewItem {
  index: number;
  questionId: string;
  text: string;
  textHi?: string;
  options: { id: string; text: string; textHi?: string }[];
  explanationHi?: string;
  type: string;
  subjectName: string;
  userAnswer: string | string[] | number | null;
  correctAnswer: string | string[] | number | null;
  explanation: string;
  isCorrect: boolean;
  status: string;
  marksObtained: number;
  marks: number;
}

type Filter = 'all' | 'correct' | 'wrong' | 'unattempted';

function getOptionText(options: QuestionReviewItem['options'], id: string | number) {
  return options.find((o) => o.id === String(id))?.text ?? String(id);
}

function formatAnswer(
  options: QuestionReviewItem['options'],
  answer: string | string[] | number | null
) {
  if (answer === null || answer === undefined || answer === '') return null;
  if (Array.isArray(answer)) {
    return answer.map((a) => getOptionText(options, a)).join(', ');
  }
  return getOptionText(options, answer);
}

function getFilterStatus(item: QuestionReviewItem): Filter {
  if (!item.userAnswer && item.status === 'not_answered') return 'unattempted';
  if (item.isCorrect) return 'correct';
  return 'wrong';
}

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'correct', label: 'Correct' },
  { id: 'wrong', label: 'Wrong' },
  { id: 'unattempted', label: 'Unattempted' },
];

export function QuestionReviewList({ questions }: { questions: QuestionReviewItem[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  const counts = {
    all: questions.length,
    correct: questions.filter((q) => getFilterStatus(q) === 'correct').length,
    wrong: questions.filter((q) => getFilterStatus(q) === 'wrong').length,
    unattempted: questions.filter((q) => getFilterStatus(q) === 'unattempted').length,
  };

  const filtered =
    filter === 'all' ? questions : questions.filter((q) => getFilterStatus(q) === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Solutions & Explanations</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
              filter === f.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-muted'
            )}
          >
            {f.label} ({counts[f.id]})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((q) => {
          const status = getFilterStatus(q);
          const userAnswerText = formatAnswer(q.options, q.userAnswer);
          const correctAnswerText = formatAnswer(q.options, q.correctAnswer);
          const correctIds = Array.isArray(q.correctAnswer)
            ? q.correctAnswer.map(String)
            : q.correctAnswer != null
              ? [String(q.correctAnswer)]
              : [];
          const userIds = Array.isArray(q.userAnswer)
            ? q.userAnswer.map(String)
            : q.userAnswer != null
              ? [String(q.userAnswer)]
              : [];

          return (
            <Card
              key={q.questionId}
              className={cn(
                'overflow-hidden border-l-4',
                status === 'correct' && 'border-l-emerald-500',
                status === 'wrong' && 'border-l-red-500',
                status === 'unattempted' && 'border-l-slate-300'
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50/80 px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                    {q.index}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {q.subjectName}
                  </Badge>
                  {status === 'correct' && (
                    <Badge className="gap-1 bg-emerald-500 text-xs hover:bg-emerald-500">
                      <CheckCircle2 className="h-3 w-3" /> Correct
                    </Badge>
                  )}
                  {status === 'wrong' && (
                    <Badge className="gap-1 bg-red-500 text-xs text-white hover:bg-red-500">
                      <XCircle className="h-3 w-3" /> Wrong
                    </Badge>
                  )}
                  {status === 'unattempted' && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <MinusCircle className="h-3 w-3" /> Unattempted
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {q.marksObtained >= 0 ? '+' : ''}
                  {q.marksObtained}/{q.marks} marks
                </span>
              </div>

              <CardContent className="space-y-4 px-4 py-4 sm:px-5">
                <BilingualText
                  text={q.text}
                  textHi={q.textHi}
                  className="text-sm leading-relaxed text-slate-800 sm:text-[15px]"
                  hiClassName="text-[13px] leading-relaxed sm:text-sm"
                />

                {q.options.length > 0 && (
                  <div className="space-y-1.5">
                    {q.options.map((opt) => {
                      const isCorrect = correctIds.includes(opt.id);
                      const isUserPick = userIds.includes(opt.id);
                      const isWrongPick = isUserPick && !isCorrect;

                      return (
                        <div
                          key={opt.id}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm',
                            isCorrect && 'border-emerald-300 bg-emerald-50',
                            isWrongPick && 'border-red-300 bg-red-50',
                            !isCorrect && !isWrongPick && 'border-transparent bg-slate-50'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                              isCorrect && 'bg-emerald-500 text-white',
                              isWrongPick && 'bg-red-500 text-white',
                              !isCorrect && !isWrongPick && 'bg-white text-slate-500 ring-1 ring-slate-200'
                            )}
                          >
                            {opt.id}
                          </span>
                          <BilingualText
                            text={opt.text}
                            textHi={opt.textHi}
                            className="flex-1 text-slate-700"
                            hiClassName="text-[13px]"
                          />
                          {isCorrect && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          )}
                          {isWrongPick && <XCircle className="h-4 w-4 shrink-0 text-red-600" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid gap-2 rounded-lg border bg-slate-50 p-3 text-sm sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-muted-foreground">Your answer: </span>
                    <span
                      className={cn(
                        'font-medium',
                        status === 'correct' && 'text-emerald-700',
                        status === 'wrong' && 'text-red-700',
                        status === 'unattempted' && 'text-slate-500'
                      )}
                    >
                      {userAnswerText ?? 'Not attempted'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Correct answer: </span>
                    <span className="font-medium text-emerald-700">
                      {correctAnswerText ?? '—'}
                    </span>
                  </div>
                </div>

                {q.explanation && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3.5 py-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Explanation
                    </p>
                    <BilingualText
                      text={q.explanation}
                      textHi={q.explanationHi}
                      className="text-sm leading-relaxed text-slate-700"
                      hiClassName="text-[13px] leading-relaxed"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No questions in this filter.
          </p>
        )}
      </div>
    </div>
  );
}
