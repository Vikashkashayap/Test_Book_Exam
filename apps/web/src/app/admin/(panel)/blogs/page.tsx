'use client';

import { useState } from 'react';
import { BookOpen, Loader2, PenLine } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useAdminBlogs,
  useCreateBlog,
  usePublishBlog,
  useUpdateBlog,
} from '@/hooks/use-pyq-admin';

export default function AdminBlogsPage() {
  const { data: blogs, isLoading } = useAdminBlogs();
  const createBlog = useCreateBlog();
  const publishBlog = usePublishBlog();
  const updateBlog = useUpdateBlog();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [author, setAuthor] = useState('MentorsDaily Team');
  const [imageUrl, setImageUrl] = useState('');
  const [publishNow, setPublishNow] = useState(true);
  const [message, setMessage] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    if (!title.trim() || !content.trim()) {
      setMessage('Title and content are required');
      return;
    }

    try {
      await createBlog.mutateAsync({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        category,
        author,
        imageUrl: imageUrl.trim() || undefined,
        isPublished: publishNow,
        showOnHomepage: publishNow,
      });
      setMessage('Blog saved successfully.');
      setTitle('');
      setExcerpt('');
      setContent('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to create blog');
    }
  }

  return (
    <div className="space-y-6 overflow-x-hidden p-4 sm:p-6 md:p-8">
      <div>
        <p className="text-sm font-medium text-primary">MentorsDaily ExamPrep Pro</p>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <BookOpen className="h-7 w-7 text-primary" />
          Blogs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Publish blogs that appear on the landing page and navbar
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Write Blog</CardTitle>
            <CardDescription>Published blogs with &quot;Show on homepage&quot; appear on the landing page</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  className="mt-1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="How to crack SSC CGL in 90 days"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Excerpt</label>
                <Input
                  className="mt-1"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Short summary for the card"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <textarea
                  className="mt-1 min-h-[160px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Full blog content..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    className="mt-1"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Author</label>
                  <Input
                    className="mt-1"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Cover image URL (optional)</label>
                <Input
                  className="mt-1"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                  className="accent-primary"
                />
                Publish &amp; show on homepage immediately
              </label>
              <Button type="submit" disabled={createBlog.isPending} className="w-full sm:w-auto">
                {createBlog.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <PenLine className="mr-2 h-4 w-4" /> Save Blog
                  </>
                )}
              </Button>
              {message && <p className="text-sm text-muted-foreground">{message}</p>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Blogs</CardTitle>
            <CardDescription>Manage publish status and homepage visibility</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </p>
            ) : !blogs?.length ? (
              <p className="text-sm text-muted-foreground">No blogs yet.</p>
            ) : (
              <ul className="space-y-3">
                {blogs.map((blog) => (
                  <li key={blog._id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{blog.title}</p>
                        <p className="text-xs text-muted-foreground">{blog.category}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {blog.isPublished ? (
                          <Badge>Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                        {blog.showOnHomepage && <Badge variant="secondary">Homepage</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!blog.isPublished && (
                        <Button
                          size="sm"
                          onClick={() => publishBlog.mutate({ id: blog._id, showOnHomepage: true })}
                          disabled={publishBlog.isPending}
                        >
                          Publish
                        </Button>
                      )}
                      {blog.isPublished && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateBlog.mutate({
                              id: blog._id,
                              showOnHomepage: !blog.showOnHomepage,
                            })
                          }
                          disabled={updateBlog.isPending}
                        >
                          {blog.showOnHomepage ? 'Hide from Homepage' : 'Show on Homepage'}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
