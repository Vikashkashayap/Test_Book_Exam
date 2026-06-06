'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useExamEcosystem } from '@/hooks/use-exams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ExamCategoriesSection() {
  const { data: ecosystem, isLoading } = useExamEcosystem();

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">All Major Government Exams</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          SSC, Banking, Railway, Police, Defence, Teaching, UPSC & State PCS — one platform
        </p>
      </div>
      {isLoading ? (
        <p className="text-center text-muted-foreground">Loading exams...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ecosystem?.map((group, i) => (
            <motion.div
              key={group.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {group.exams.slice(0, 4).map((e) => (
                      <li key={e.slug}>• {e.name}</li>
                    ))}
                    {group.exams.length > 4 && (
                      <li className="text-primary">+{group.exams.length - 4} more</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      <div className="text-center mt-10">
        <Link href="/register">
          <Button size="lg">Select Your Exams — Register Free</Button>
        </Link>
      </div>
    </section>
  );
}
