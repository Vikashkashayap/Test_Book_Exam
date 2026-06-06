'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Target, XCircle, MinusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, ApiSuccess } from '@/lib/api';
import { formatPercent } from '@/lib/utils';
import { QuestionReviewList, type QuestionReviewItem } from '@/components/test/QuestionReviewList';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ResultData {
  score: number;
  maxScore: number;
  percentage: number;
  rank?: number;
  percentile?: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  accuracy: number;
  totalTimeSeconds: number;
  subjectAnalysis: { subjectName: string; accuracy: number; correct: number; total: number }[];
  aiAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    improvementAreas: string[];
    studyPlan: string[];
  };
  testId: { title: string };
  questionReview?: QuestionReviewItem[];
}

const COLORS = ['#22c55e', '#ef4444', '#94a3b8'];

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    api<ApiSuccess<ResultData>>(`/tests/results/${id}`)
      .then((res) => setResult(res.data))
      .catch(console.error);
  }, [id]);

  if (!result) {
    return <div className="p-8 text-center text-muted-foreground">Loading results...</div>;
  }

  const pieData = [
    { name: 'Correct', value: result.correctCount },
    { name: 'Wrong', value: result.wrongCount },
    { name: 'Unattempted', value: result.unattemptedCount },
  ];

  return (
    <div className="overflow-x-hidden p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">{result.testId?.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Result Analysis</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-4xl font-bold text-primary">{result.score}/{result.maxScore}</p>
            <p className="text-sm text-muted-foreground mt-1">Score ({formatPercent(result.percentage)})</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <Trophy className="h-8 w-8 mx-auto text-amber-500" />
            <p className="text-2xl font-bold mt-2">#{result.rank ?? '—'}</p>
            <p className="text-sm text-muted-foreground">Rank</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{result.percentile?.toFixed(1) ?? '—'}%</p>
            <p className="text-sm text-muted-foreground">Percentile</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{Math.round(result.totalTimeSeconds / 60)} min</p>
            <p className="text-sm text-muted-foreground">Time Spent</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { icon: Target, label: 'Correct', value: result.correctCount, color: 'text-green-600' },
          { icon: XCircle, label: 'Wrong', value: result.wrongCount, color: 'text-red-600' },
          { icon: MinusCircle, label: 'Unattempted', value: result.unattemptedCount, color: 'text-gray-500' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 flex items-center gap-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Answer Distribution</CardTitle></CardHeader>
          <CardContent className="h-56 min-h-[14rem] sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Subject Analysis</CardTitle></CardHeader>
          <CardContent className="h-56 min-h-[14rem] sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.subjectAnalysis}>
                <XAxis dataKey="subjectName" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {result.questionReview && result.questionReview.length > 0 && (
        <QuestionReviewList questions={result.questionReview} />
      )}

      {result.aiAnalysis && (
        <Card className="border-accent/30">
          <CardHeader>
            <CardTitle>AI Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
              <ul className="text-sm space-y-1 list-disc pl-4">
                {result.aiAnalysis.strengths.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-600 mb-2">Weaknesses</h4>
              <ul className="text-sm space-y-1 list-disc pl-4">
                {result.aiAnalysis.weaknesses.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-medium mb-2">7-Day Study Plan</h4>
              <ol className="text-sm space-y-1 list-decimal pl-4">
                {result.aiAnalysis.studyPlan.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 justify-center sm:flex-row sm:gap-4">
        <Link href="/history" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full min-h-[44px]">View History</Button>
        </Link>
        <Link href="/tests" className="w-full sm:w-auto"><Button variant="outline" className="w-full min-h-[44px]">More Tests</Button></Link>
        <Link href="/dashboard" className="w-full sm:w-auto"><Button className="w-full min-h-[44px]">Back to Dashboard</Button></Link>
      </div>
    </div>
  );
}
