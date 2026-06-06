import Link from 'next/link';
import { ArrowRight, BarChart3, Bot, BookOpen, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExamCategoriesSection } from '@/components/landing/ExamCategoriesSection';

const features = [
  {
    icon: BookOpen,
    title: 'Full-Length Mock Tests',
    description: 'SSC, Banking, UPSC-style mocks with negative marking and real exam interface.',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    description: 'Subject-wise, topic-wise accuracy, speed graphs, and percentile rankings.',
  },
  {
    icon: Bot,
    title: 'AI Performance Coach',
    description: 'Personalized study plans, weakness analysis, and 24/7 AI mentor chat.',
  },
  {
    icon: Trophy,
    title: 'Gamification',
    description: 'Points, badges, streaks, and weekly leaderboards to stay motivated.',
  },
];

const stats = [
  { value: '10K+', label: 'Questions' },
  { value: '500+', label: 'Mock Tests' },
  { value: '50K+', label: 'Students' },
  { value: '98%', label: 'Satisfaction' },
];

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <section className="relative overflow-hidden bg-hero-pattern text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur mb-6">
              MentorsDaily ExamPrep Pro
            </span>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Crack SSC, Banking, UPSC &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                40+ Govt Exams
              </span>
            </h1>
            <p className="mt-6 text-lg text-blue-100 md:text-xl">
              Full-length mocks, AI-powered analysis, current affairs, and an exam interface built
              like Testbook & Oliveboard — all in one platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/50 bg-transparent text-white hover:bg-white/15 hover:text-white w-full sm:w-auto"
                >
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-sm text-blue-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ExamCategoriesSection />

      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Everything you need to rank higher</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            From daily quizzes to AI mentorship — designed for serious exam preparation.
          </p>
        </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
                <CardDescription>{f.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden border-0 shadow-2xl">
            <div className="grid md:grid-cols-2">
              <CardContent className="p-8 md:p-12 flex flex-col justify-center">
                <Zap className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-2xl font-bold">AI analyzes every test you take</h3>
                <p className="text-muted-foreground mt-3">
                  Get strengths, weaknesses, a 7-day study plan, and suggested mocks — automatically
                  after each attempt.
                </p>
                <Link href="/register" className="mt-6">
                  <Button>Try AI Analysis</Button>
                </Link>
              </CardContent>
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-8 md:p-12 flex items-center justify-center min-h-[280px]">
                <div className="space-y-3 w-full max-w-sm">
                  {['Strong in Quant', 'Weak in Reasoning', 'Practice 3 topic tests'].map((t, i) => (
                    <div key={t} className="rounded-lg bg-card p-4 shadow text-sm font-medium animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
