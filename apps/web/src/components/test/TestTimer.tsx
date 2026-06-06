'use client';

import { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
  seconds: number;
  onExpire: () => void;
  onTick: () => void;
  hasTimer?: boolean;
  compact?: boolean;
}

export function TestTimer({ seconds, onExpire, onTick, hasTimer = true, compact }: Props) {
  useEffect(() => {
    if (!hasTimer) return;
    if (seconds <= 0) {
      onExpire();
      return;
    }
    const id = setInterval(onTick, 1000);
    return () => clearInterval(id);
  }, [seconds, onExpire, onTick, hasTimer]);

  if (!hasTimer) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-lg border bg-muted/60 font-mono font-bold text-muted-foreground',
          compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-base md:text-lg'
        )}
      >
        <Clock className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        <span className="hidden sm:inline">No limit</span>
        <span className="sm:hidden">∞</span>
      </div>
    );
  }

  const isLow = seconds < 300;
  const isCritical = seconds < 60;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg border font-mono font-bold tabular-nums',
        compact ? 'px-3 py-1.5 text-sm md:text-base' : 'px-4 py-2 text-base md:text-lg',
        isCritical
          ? 'border-destructive bg-destructive text-destructive-foreground animate-pulse'
          : isLow
            ? 'border-destructive/40 bg-destructive/10 text-destructive'
            : 'border-border bg-muted/60'
      )}
      aria-live="polite"
      aria-label={`Time remaining ${formatDuration(seconds)}`}
    >
      <Clock className={cn('shrink-0', compact ? 'h-4 w-4' : 'h-5 w-5')} />
      {formatDuration(seconds)}
    </div>
  );
}
