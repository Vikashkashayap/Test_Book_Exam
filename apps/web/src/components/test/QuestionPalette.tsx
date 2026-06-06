'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { AnswerStatus } from '@/store/test-attempt.store';

interface Props {
  total: number;
  currentIndex: number;
  getStatus: (index: number) => AnswerStatus;
  onSelect: (index: number) => void;
  compact?: boolean;
}

const statusColors: Record<AnswerStatus, string> = {
  answered: 'bg-emerald-500 text-white hover:bg-emerald-600',
  not_answered: 'bg-background text-foreground border border-border hover:bg-muted',
  marked_for_review: 'bg-amber-500 text-white hover:bg-amber-600',
  answered_marked: 'bg-purple-500 text-white hover:bg-purple-600',
};

const legend = [
  { status: 'not_answered' as const, label: 'Not visited' },
  { status: 'answered' as const, label: 'Answered' },
  { status: 'marked_for_review' as const, label: 'Marked' },
  { status: 'answered_marked' as const, label: 'Ans + marked' },
];

export function QuestionPalette({ total, currentIndex, getStatus, onSelect, compact }: Props) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const cols = total > 60 ? 10 : total > 30 ? 8 : 5;

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentIndex]);

  return (
    <div className={cn('space-y-3', compact ? 'p-3' : 'p-4')}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
        {legend.map((item) => (
          <span key={item.status} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-sm', statusColors[item.status])} />
            {item.label}
          </span>
        ))}
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const status = getStatus(i);
          const isActive = currentIndex === i;
          return (
            <button
              key={i}
              ref={isActive ? activeRef : undefined}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Go to question ${i + 1}`}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'flex aspect-square min-h-[32px] w-full items-center justify-center rounded text-xs font-semibold transition-all',
                statusColors[status],
                isActive && 'ring-2 ring-primary ring-offset-1 scale-105 z-10'
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
