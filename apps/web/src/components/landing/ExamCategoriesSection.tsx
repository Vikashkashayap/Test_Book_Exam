'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useExamEcosystem } from '@/hooks/use-exams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const accentTextClass =
  'bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent';

export function ExamCategoriesSection() {
  const { data: ecosystem, isLoading } = useExamEcosystem();

  return (
    <section className="bg-[#071428] py-16 text-white sm:py-20">
      <div className="container mx-auto px-6 sm:px-8 md:px-10 lg:px-14">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-3xl font-bold sm:text-4xl">
            All Major{' '}
            <span className={accentTextClass}>Government Exams</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-blue-100/80 sm:mt-4 sm:text-lg">
            <span className={accentTextClass}>SSC, Banking, Railway, Police</span>, Defence,
            Teaching, UPSC & State PCS — one platform
          </p>
        </div>

        {isLoading ? (
          <p className="text-center text-sky-200/70">Loading exams...</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {ecosystem?.map((group, i) => (
              <motion.div
                key={group.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={cn(
                    'h-full border shadow-lg shadow-black/20 transition-all hover:shadow-xl',
                    i % 2 === 0
                      ? 'border-sky-400/20 bg-[#0a1e3a]/95 hover:border-sky-300/40'
                      : 'border-blue-400/15 bg-[#0d1f3c]/90 hover:border-blue-300/35'
                  )}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className={cn('text-lg font-bold', accentTextClass)}>
                      {group.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5 text-sm text-blue-100/80">
                      {group.exams.slice(0, 4).map((e) => (
                        <li key={e.slug} className="flex gap-2">
                          <span className="text-sky-400">•</span>
                          <span>{e.name}</span>
                        </li>
                      ))}
                      {group.exams.length > 4 && (
                        <li className={cn('pt-1 font-semibold', accentTextClass)}>
                          +{group.exams.length - 4} more
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row sm:gap-4">
          <Link href="/register">
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-full border-2 border-sky-400/50 bg-sky-500/10 px-8 text-sky-100 hover:bg-sky-500/20 hover:text-white sm:w-auto"
            >
              Select Your Exams
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="lg"
              className="w-full rounded-full bg-gradient-to-r from-sky-300 to-blue-400 px-8 font-semibold text-[#071428] shadow-lg shadow-sky-950/30 hover:from-sky-200 hover:to-blue-300 sm:w-auto"
            >
              Register Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
