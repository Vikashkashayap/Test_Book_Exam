'use client';

import { AlertTriangle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  submitting?: boolean;
  answeredCount: number;
  totalQuestions: number;
  markedCount: number;
}

export function SubmitTestDialog({
  open,
  onOpenChange,
  onConfirm,
  submitting = false,
  answeredCount,
  totalQuestions,
  markedCount,
}: Props) {
  if (!open) return null;

  const unattempted = totalQuestions - answeredCount;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-test-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={() => !submitting && onOpenChange(false)}
        aria-label="Close dialog"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b bg-slate-50/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 id="submit-test-title" className="text-base font-semibold text-slate-900">
                Submit Test?
              </h2>
              <p className="text-sm text-muted-foreground">क्या आप टेस्ट जमा करना चाहते हैं?</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <p className="text-sm leading-relaxed text-slate-700">
            You cannot change your answers after submission. Please review your progress before
            submitting.
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            जमा करने के बाद आप अपने उत्तर बदल नहीं सकते। कृपया जमा करने से पहले अपनी प्रगति की
            समीक्षा करें।
          </p>

          <div className="grid grid-cols-3 gap-2 rounded-xl border bg-slate-50 p-3 text-center text-sm">
            <div>
              <p className="text-lg font-bold text-emerald-600">{answeredCount}</p>
              <p className="text-xs text-muted-foreground">Answered</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600">{markedCount}</p>
              <p className="text-xs text-muted-foreground">Marked</p>
            </div>
            <div>
              <p className={cn('text-lg font-bold', unattempted > 0 ? 'text-red-600' : 'text-slate-500')}>
                {unattempted}
              </p>
              <p className="text-xs text-muted-foreground">Unattempted</p>
            </div>
          </div>

          {unattempted > 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {unattempted} question{unattempted > 1 ? 's' : ''} still unattempted. You can go back
              and answer them before submitting.
            </p>
          )}
        </div>

        <div className="flex gap-3 border-t bg-slate-50/50 px-5 py-4">
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="h-11 flex-1 gap-1.5"
            onClick={onConfirm}
            disabled={submitting}
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit Test'}
          </Button>
        </div>
      </div>
    </div>
  );
}
