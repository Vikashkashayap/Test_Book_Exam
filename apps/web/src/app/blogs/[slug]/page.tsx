'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Loader2, User } from 'lucide-react';
import { api, ApiSuccess } from '@/lib/api';
import type { PublicBlogItem } from '@/hooks/use-public-content';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BlogDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [blog, setBlog] = useState<(PublicBlogItem & { content?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api<ApiSuccess<PublicBlogItem & { content: string }>>(`/public/blogs/${slug}`)
      .then((res) => setBlog(res.data))
      .catch(() => setError('Blog not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <main className="container mx-auto flex min-h-[50vh] items-center justify-center px-4 py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (error || !blog) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{error || 'Blog not found'}</p>
        <Link href="/#blogs" className="mt-4 inline-block">
          <Button variant="outline">Back to Blogs</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 md:py-16">
      <Link
        href="/#blogs"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Blogs
      </Link>

      {blog.imageUrl && (
        <div className="mb-6 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={blog.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <Badge variant="secondary" className="mb-3">
        {blog.category}
      </Badge>
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{blog.title}</h1>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <User className="h-4 w-4" />
          {blog.author}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {new Date(blog.publishedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>

      {blog.excerpt && (
        <p className="mt-6 text-lg text-muted-foreground">{blog.excerpt}</p>
      )}

      <article className="prose prose-slate mt-8 max-w-none whitespace-pre-wrap dark:prose-invert">
        {blog.content}
      </article>
    </main>
  );
}
