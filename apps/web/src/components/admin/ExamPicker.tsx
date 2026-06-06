'use client';

import { useState } from 'react';
import { ChevronRight, GraduationCap, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useAdminExams,
  useCreateExam,
  type ExamItem,
} from '@/hooks/use-exam-management';
import { cn } from '@/lib/utils';

export interface SelectedExam {
  examId: string;
  examSlug: string;
  examName: string;
  categoryName: string;
  categorySlug: string;
}

interface ExamPickerProps {
  selected: SelectedExam | null;
  onSelect: (exam: SelectedExam | null) => void;
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { num: 1, label: 'Select Exam' },
    { num: 2, label: 'Upload' },
  ] as const;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
              step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {s.num}
          </div>
          <span className={cn('text-sm font-medium', step >= s.num ? 'text-foreground' : 'text-muted-foreground')}>
            {s.label}
          </span>
          {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}

function toSelectedExam(exam: ExamItem): SelectedExam {
  const category = exam.categoryId;
  return {
    examId: exam._id,
    examSlug: exam.slug,
    examName: exam.name,
    categoryName: typeof category === 'object' && category ? category.name : '',
    categorySlug: exam.categorySlug ?? (typeof category === 'object' && category ? category.slug : ''),
  };
}

export function ExamPicker({ selected, onSelect }: ExamPickerProps) {
  const [showExamForm, setShowExamForm] = useState(false);
  const [examName, setExamName] = useState('');
  const [createError, setCreateError] = useState('');

  const { data: exams, isLoading } = useAdminExams();
  const createExam = useCreateExam();
  const currentStep: 1 | 2 = selected ? 2 : 1;

  function handleDropdownChange(examId: string) {
    if (!examId) {
      onSelect(null);
      return;
    }
    const exam = exams?.find((e) => e._id === examId);
    if (exam) onSelect(toSelectedExam(exam));
  }

  async function handleCreateExam() {
    if (!examName.trim()) {
      setCreateError('Exam name likho (e.g. UPPCS, SSC CGL)');
      return;
    }
    setCreateError('');
    try {
      const created = await createExam.mutateAsync({
        name: examName.trim(),
        slug: examName.trim().toLowerCase().replace(/\s+/g, '-'),
      });
      setExamName('');
      setShowExamForm(false);
      const data = (created as { data?: ExamItem }).data;
      if (data) onSelect(toSelectedExam(data));
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Exam create nahi hua');
    }
  }

  return (
    <div className="space-y-4">
      <StepIndicator step={currentStep} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5" />
            Kis exam ke liye upload kar rahe ho?
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowExamForm((v) => !v)}>
            <Plus className="h-4 w-4 mr-1" /> Add Exam
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showExamForm && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">Naya exam naam likho — category ki zaroorat nahi</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Input
                  placeholder="Exam name (e.g. UPPCS, SSC CGL)"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="max-w-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateExam()}
                />
                <Button onClick={handleCreateExam} disabled={!examName.trim() || createExam.isPending}>
                  {createExam.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button variant="ghost" onClick={() => { setShowExamForm(false); setCreateError(''); }}>
                  Cancel
                </Button>
              </div>
              {createError && <p className="text-sm text-destructive">{createError}</p>}
            </div>
          )}
          <select
            className="w-full max-w-lg border rounded-md px-3 py-2.5 text-sm bg-background"
            value={selected?.examId ?? ''}
            onChange={(e) => handleDropdownChange(e.target.value)}
            disabled={isLoading}
          >
            <option value="">
              {isLoading ? 'Loading exams...' : 'Select exam (e.g. SSC CGL, UP Police, UPPCS)'}
            </option>
            {exams?.map((exam) => (
              <option key={exam._id} value={exam._id}>
                {exam.name}
                {exam.categoryId?.name ? ` — ${exam.categoryId.name}` : ''}
              </option>
            ))}
          </select>
          {selected && (
            <div className="flex items-center gap-2 flex-wrap rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <GraduationCap className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">Uploading for:</span>
              <span className="font-semibold">{selected.examName}</span>
              <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-auto">
                {selected.examSlug}
              </code>
            </div>
          )}
          {!isLoading && !exams?.length && !showExamForm && (
            <p className="text-sm text-muted-foreground">
              Koi exam nahi mila. &quot;Add Exam&quot; se naya exam banao.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
