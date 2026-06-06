'use client';

import { Fragment } from 'react';
import { cn } from '@/lib/utils';

function formatMath(expr: string): string {
  return expr
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^(\d)/g, '^$1')
    .replace(/\*/g, '×');
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\$[^$]+\$|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(
        <Fragment key={`${keyPrefix}-t-${idx++}`}>{text.slice(last, match.index)}</Fragment>
      );
    }

    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(
        <strong key={`${keyPrefix}-b-${idx++}`} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('$')) {
      parts.push(
        <span
          key={`${keyPrefix}-m-${idx++}`}
          className="mx-0.5 inline-block rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-[13px] text-blue-800"
        >
          {formatMath(token.slice(1, -1))}
        </span>
      );
    } else if (token.startsWith('`')) {
      parts.push(
        <code
          key={`${keyPrefix}-c-${idx++}`}
          className="rounded bg-slate-200/70 px-1 py-0.5 font-mono text-[13px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    last = match.index + token.length;
  }

  if (last < text.length) {
    parts.push(<Fragment key={`${keyPrefix}-t-${idx++}`}>{text.slice(last)}</Fragment>);
  }

  return parts.length ? parts : [text];
}

function parseBlock(block: string, index: number) {
  const lines = block.split('\n').filter((l) => l.trim());
  if (!lines.length) return null;

  const isBulletList = lines.every((l) => /^[\s]*[-*•]\s+/.test(l));
  if (isBulletList) {
    return (
      <ul key={index} className="list-disc space-y-2 pl-5 marker:text-primary">
        {lines.map((line, j) => (
          <li key={j} className="leading-relaxed">
            {renderInline(line.replace(/^[\s]*[-*•]\s+/, ''), `li-${index}-${j}`)}
          </li>
        ))}
      </ul>
    );
  }

  const isNumberedList = lines.every((l) => /^[\s]*\d+\.\s+/.test(l));
  if (isNumberedList) {
    return (
      <ol key={index} className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-primary">
        {lines.map((line, j) => (
          <li key={j} className="leading-relaxed">
            {renderInline(line.replace(/^[\s]*\d+\.\s+/, ''), `ol-${index}-${j}`)}
          </li>
        ))}
      </ol>
    );
  }

  if (lines.length === 1) {
    const line = lines[0];
    if (/^#{1,3}\s+/.test(line)) {
      return (
        <p key={index} className="text-base font-semibold text-slate-900">
          {renderInline(line.replace(/^#{1,3}\s+/, ''), `h-${index}`)}
        </p>
      );
    }
    return (
      <p key={index} className="leading-relaxed">
        {renderInline(line, `p-${index}`)}
      </p>
    );
  }

  return (
    <div key={index} className="space-y-1.5">
      {lines.map((line, j) => {
        const bullet = line.match(/^[\s]*[-*•]\s+(.*)/);
        if (bullet) {
          return (
            <div key={j} className="flex gap-2 leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{renderInline(bullet[1], `mix-${index}-${j}`)}</span>
            </div>
          );
        }
        return (
          <p key={j} className="leading-relaxed">
            {renderInline(line, `pl-${index}-${j}`)}
          </p>
        );
      })}
    </div>
  );
}

export function MentorMessageContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = content.split(/\n{2,}/).filter((b) => b.trim());

  return (
    <div className={cn('space-y-3 text-[14px] text-slate-700 sm:text-[15px]', className)}>
      {blocks.map((block, i) => parseBlock(block.trim(), i))}
    </div>
  );
}
