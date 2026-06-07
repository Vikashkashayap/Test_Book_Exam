'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, User } from 'lucide-react';
import { usePublicBlogs } from '@/hooks/use-public-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function BlogsSection() {
  const { data: blogs, isLoading } = usePublicBlogs();

  return (
    <section id="blogs" className="scroll-mt-20 bg-[#071428] py-16 text-white sm:py-20">
      <div className="container mx-auto px-6 sm:px-8 md:px-10 lg:px-14">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-3xl font-bold sm:text-4xl">Latest Exam Prep Blogs</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-blue-100/75 sm:mt-4 sm:text-lg">
            Tips, strategies, and updates to help you prepare smarter.
          </p>
        </div>

        {isLoading ? (
          <p className="text-center text-blue-100/70">Loading blogs...</p>
        ) : !blogs?.length ? (
          <p className="text-center text-blue-100/70">New blogs coming soon. Stay tuned!</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {blogs.map((blog, i) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full overflow-hidden border border-white/10 bg-[#0d1f3c]/90 text-white shadow-lg shadow-black/20 transition-all hover:border-sky-400/25 hover:shadow-xl">
                  {blog.imageUrl && (
                    <div className="aspect-[16/9] overflow-hidden bg-[#071428]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={blog.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="border-sky-400/25 bg-sky-500/15 text-sky-200 hover:bg-sky-500/20">
                        {blog.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-snug text-white">
                      <Link
                        href={`/blogs/${blog.slug}`}
                        className="transition-colors hover:text-sky-300"
                      >
                        {blog.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {blog.excerpt && (
                      <p className="line-clamp-3 text-sm leading-relaxed text-blue-100/70">
                        {blog.excerpt}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-blue-200/60">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {blog.author}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(blog.publishedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
