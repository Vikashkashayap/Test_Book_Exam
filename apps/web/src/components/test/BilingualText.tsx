'use client';

import { cn } from '@/lib/utils';

export function BilingualText({
  text,
  textHi,
  className,
  hiClassName,
}: {
  text: string;
  textHi?: string;
  className?: string;
  hiClassName?: string;
}) {
  if (!textHi) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={cn('block space-y-1', className)}>
      <span className="block">{text}</span>
      <span className={cn('block text-slate-600', hiClassName)}>{textHi}</span>
    </span>
  );
}
