import Link from 'next/link';
import { BarChart3, Bot, BookOpen, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExamCategoriesSection } from '@/components/landing/ExamCategoriesSection';
import { BlogsSection } from '@/components/landing/BlogsSection';
import { HeroSection } from '@/components/landing/HeroSection';
import { WhatsAppWidget } from '@/components/landing/WhatsAppWidget';

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

export default function LandingPage() {
  return (
    <>
    <main className="overflow-x-hidden">
      <HeroSection />

      <ExamCategoriesSection />

      <section id="features" className="bg-[#071428] py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8 md:px-10 lg:px-14">
          <div className="mb-10 text-center sm:mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Everything you need to rank higher
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-blue-100/75 sm:mt-4 sm:text-lg">
              From daily quizzes to AI mentorship — designed for serious exam preparation.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
            {features.map((f) => (
              <Card
                key={f.title}
                className="border border-white/10 bg-[#0d1f3c]/90 text-white shadow-lg shadow-black/20 transition-shadow hover:border-sky-400/25 hover:shadow-xl"
              >
                <CardHeader className="space-y-4">
                  <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-400/20">
                    <f.icon className="h-6 w-6 text-sky-300" />
                  </div>
                  <CardTitle className="text-lg text-white">{f.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-blue-100/70">
                    {f.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <BlogsSection />

      <section className="bg-[#050f1f] py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8 md:px-10 lg:px-14">
          <Card className="overflow-hidden border border-white/10 bg-[#0d1f3c]/90 text-white shadow-2xl shadow-black/30">
            <div className="grid md:grid-cols-2">
              <CardContent className="flex flex-col justify-center p-8 md:p-12">
                <Zap className="mb-4 h-10 w-10 text-sky-300" />
                <h3 className="text-2xl font-bold text-white sm:text-3xl">
                  AI analyzes every test you take
                </h3>
                <p className="mt-3 text-base leading-relaxed text-blue-100/75 sm:text-lg">
                  Get strengths, weaknesses, a 7-day study plan, and suggested mocks — automatically
                  after each attempt.
                </p>
                <Link href="/register" className="mt-6">
                  <Button className="rounded-full bg-white px-8 font-semibold text-[#0b3d91] hover:bg-white/90">
                    Try AI Analysis
                  </Button>
                </Link>
              </CardContent>
              <div className="flex min-h-[280px] items-center justify-center bg-gradient-to-br from-sky-500/10 to-blue-600/10 p-8 md:p-12">
                <div className="w-full max-w-sm space-y-3">
                  {['Strong in Quant', 'Weak in Reasoning', 'Practice 3 topic tests'].map((t, i) => (
                    <div
                      key={t}
                      className="animate-pulse rounded-lg border border-white/10 bg-[#071428]/80 p-4 text-sm font-medium text-blue-100"
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
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
    <WhatsAppWidget />
    </>
  );
}
