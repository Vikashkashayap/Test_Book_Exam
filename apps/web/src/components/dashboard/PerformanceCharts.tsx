'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface Props {
  results: { _id: string; percentage: number; testId: { title: string } }[];
}

export function PerformanceCharts({ results }: Props) {
  const chartData = results
    .slice()
    .reverse()
    .map((r, i) => ({
      name: `Test ${i + 1}`,
      score: r.percentage,
      accuracy: r.percentage,
    }));

  if (!chartData.length) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
        No test data yet — attempt a mock to see charts
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="h-56 min-h-[14rem] w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={32} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="h-56 min-h-[14rem] w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={32} />
            <Tooltip />
            <Bar dataKey="accuracy" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
