'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Coins, Zap, Database, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExamSelect } from '@/components/admin/ExamSelect';
import {
  useAiQuestionStatus,
  useExamProfile,
  useGenerateAiQuestions,
  useQuestionBankAnalytics,
  type GenerationAnalytics,
  type BankQuestion,
} from '@/hooks/use-ai-questions';
import { cn } from '@/lib/utils';

const QUESTION_COUNTS = [10, 20, 30] as const;

export default function AiQuestionsPage() {
  const [examId, setExamId] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<10 | 20 | 30>(10);
  const [message, setMessage] = useState('');
  const [generated, setGenerated] = useState<BankQuestion[]>([]);
  const [analytics, setAnalytics] = useState<GenerationAnalytics | null>(null);

  const { data: status } = useAiQuestionStatus();
  const { data: profileData, isLoading: profileLoading } = useExamProfile(examId || undefined);
  const { data: bankAnalytics } = useQuestionBankAnalytics(profileData?.examSlug);
  const generate = useGenerateAiQuestions();

  const subjects = profileData?.profile.subjects ?? [];

  async function handleGenerate() {
    if (!examId || !subject || !topic.trim()) {
      setMessage('Exam, Subject aur Topic select karo');
      return;
    }
    setMessage('');
    setGenerated([]);
    setAnalytics(null);

    try {
      const res = await generate.mutateAsync({
        examId,
        subject,
        topic: topic.trim(),
        difficulty,
        questionCount,
      });
      setGenerated(res.data.questions);
      setAnalytics(res.data.analytics);
      setMessage(
        `${res.data.analytics.questionsSaved} questions saved to Question Bank (${res.data.analytics.duplicatesRemoved} duplicates skipped)`
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Generation failed');
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Question Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate MCQs into the Question Bank. Tests are built separately — no AI needed at test time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status?.configured ? 'default' : 'destructive'}>
            {status?.configured ? 'OpenRouter Ready' : 'API Key Missing'}
          </Badge>
          {status?.model && (
            <Badge variant="outline" className="font-mono text-xs">
              {status.model}
            </Badge>
          )}
        </div>
      </div>

      {bankAnalytics && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: 'Generated', value: bankAnalytics.analytics.questionsGenerated, icon: Zap },
            { label: 'Saved', value: bankAnalytics.analytics.questionsSaved, icon: CheckCircle2 },
            { label: 'Duplicates', value: bankAnalytics.analytics.duplicatesRemoved, icon: Database },
            { label: 'Tokens', value: bankAnalytics.analytics.totalTokens.toLocaleString(), icon: Coins },
            {
              label: 'Est. Cost',
              value: `$${bankAnalytics.analytics.estimatedCostUsd.toFixed(4)}`,
              icon: Coins,
            },
          ].map((stat) => (
            <Card key={stat.label} className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <stat.icon className="h-3 w-3" />
                {stat.label}
              </div>
              <p className="text-lg font-semibold mt-1">{stat.value}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate Questions</CardTitle>
            <CardDescription>
              Max {QUESTION_COUNTS.join('/')} per request. Questions are stored permanently in the bank.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Exam</label>
              <ExamSelect value={examId} onChange={(id) => { setExamId(id); setSubject(''); }} />
            </div>

            {profileData && (
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">Pattern: {profileData.profile.pattern}</Badge>
                <Badge variant="secondary">Default: {profileData.profile.difficulty}</Badge>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Subject</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {subjects.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={subject === s ? 'default' : 'outline'}
                    onClick={() => setSubject(s)}
                    disabled={!examId || profileLoading}
                  >
                    {s}
                  </Button>
                ))}
                {!subjects.length && examId && !profileLoading && (
                  <p className="text-sm text-muted-foreground">No subjects for this exam</p>
                )}
                {profileLoading && examId && (
                  <p className="text-sm text-muted-foreground">Loading subjects...</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Topic</label>
              <Input
                placeholder="e.g. Coding Decoding, Percentage, Indian Polity"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Difficulty</label>
              <div className="flex gap-2 mt-1">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant={difficulty === d ? 'default' : 'outline'}
                    onClick={() => setDifficulty(d)}
                    className="capitalize"
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Question Count</label>
              <div className="flex gap-2 mt-1">
                {QUESTION_COUNTS.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    size="sm"
                    variant={questionCount === c ? 'default' : 'outline'}
                    onClick={() => setQuestionCount(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={generate.isPending || !status?.configured}
            >
              {generate.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate Questions</>
              )}
            </Button>

            {message && (
              <p className={cn('text-sm', message.includes('failed') || message.includes('select') ? 'text-destructive' : 'text-green-600')}>
                {message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {generated.length ? `${generated.length} questions generated` : 'Generated questions appear here'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics && (
              <div className="mb-4 p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <p>Generated: {analytics.questionsGenerated} | Saved: {analytics.questionsSaved} | Duplicates: {analytics.duplicatesRemoved}</p>
                <p>Tokens: {analytics.tokenUsage.totalTokens.toLocaleString()} | Cost: ${analytics.tokenUsage.estimatedCostUsd.toFixed(4)}</p>
              </div>
            )}

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {generated.map((q, i) => (
                <div key={q._id ?? i} className="p-3 rounded-lg border text-sm">
                  <div className="flex gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{q.subject}</Badge>
                    <Badge variant="outline" className="text-xs">{q.topic}</Badge>
                    <Badge variant="secondary" className="text-xs capitalize">{q.difficulty}</Badge>
                  </div>
                  <p className="font-medium">{q.question}</p>
                  <ul className="mt-2 space-y-0.5 text-muted-foreground">
                    {q.options.map((opt, j) => (
                      <li key={j} className={q.correctAnswer === String.fromCharCode(65 + j) ? 'text-green-600 font-medium' : ''}>
                        {String.fromCharCode(65 + j)}. {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {!generated.length && !generate.isPending && (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Select exam details and click Generate Questions
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
