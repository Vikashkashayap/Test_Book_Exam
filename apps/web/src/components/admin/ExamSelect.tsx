'use client';

import { useMemo } from 'react';
import { useAdminExams } from '@/hooks/use-exam-management';
import { cn } from '@/lib/utils';

interface ExamSelectProps {
  value: string;
  onChange: (examId: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ExamSelect({
  value,
  onChange,
  className,
  placeholder = 'Exam select karo',
  disabled,
}: ExamSelectProps) {
  const { data: exams, isLoading } = useAdminExams();

  const sortedExams = useMemo(
    () => [...(exams ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [exams]
  );

  return (
    <select
      className={cn(
        'w-full border rounded-md px-3 py-2.5 text-sm bg-background',
        className
      )}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isLoading}
    >
      <option value="">{isLoading ? 'Loading exams...' : placeholder}</option>
      {sortedExams.map((exam) => (
        <option key={exam._id} value={exam._id}>
          {exam.name}
        </option>
      ))}
    </select>
  );
}
