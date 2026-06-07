'use client';

import { useState } from 'react';
import { FileDown, FileText, Loader2 } from 'lucide-react';
import { usePublicPyq, PYQ_FILTERS } from '@/hooks/use-public-content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PyqPage() {
  const [category, setCategory] = useState('all');
  const { data, isLoading } = usePublicPyq(category);

  return (
    <main className="min-h-screen bg-muted/20">
      <section className="border-b bg-background">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <h1 className="text-3xl font-bold md:text-4xl">Previous Year Papers (PYQ)</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Download official previous year question papers — sorted year-wise as uploaded by our team.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-10">
        <div className="mb-8 flex flex-wrap gap-2">
          {PYQ_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setCategory(filter.value)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                category === filter.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background text-muted-foreground ring-1 ring-border hover:text-foreground'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading papers...
          </p>
        ) : !data?.years?.length ? (
          <div className="rounded-xl border bg-background p-10 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No PYQ PDFs uploaded yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-10">
            {data.years.map((group) => (
              <div key={group.year ?? 'unknown'}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-2xl font-bold">
                    {group.year ? `${group.year}` : 'Other Papers'}
                  </h2>
                  <Badge variant="secondary">{group.papers.length} PDFs</Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {group.papers.map((paper) => (
                    <article
                      key={paper.id}
                      className="flex flex-col rounded-xl border bg-background p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <Badge variant="outline">{paper.exam}</Badge>
                        {paper.year && (
                          <Badge variant="secondary">{paper.year}</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold leading-snug">{paper.title}</h3>
                      {paper.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {paper.description}
                        </p>
                      )}
                      <div className="mt-4 pt-2">
                        <a
                          href={paper.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="w-full gap-2">
                            <FileDown className="h-4 w-4" />
                            Download PDF
                          </Button>
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
