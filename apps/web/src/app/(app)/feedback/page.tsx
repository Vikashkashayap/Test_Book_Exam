'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquarePlus, Send, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ListSkeleton } from '@/components/ui/page-skeletons';
import { api, ApiSuccess } from '@/lib/api';
import { cn } from '@/lib/utils';

type FeedbackCategory = 'bug' | 'improvement' | 'feature' | 'other';

type FeedbackItem = {
  _id: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  status: 'new' | 'reviewed' | 'resolved';
  createdAt: string;
};

const categoryOptions: { value: FeedbackCategory; label: string; description: string }[] = [
  { value: 'bug', label: 'Bug / Not Working', description: 'Kuch kaam nahi kar raha ya error aa raha hai' },
  { value: 'improvement', label: 'Improvement', description: 'Kya update karna hai ya kaise better ho sakta hai' },
  { value: 'feature', label: 'New Feature', description: 'Naya feature ya content chahiye' },
  { value: 'other', label: 'Other', description: 'Koi aur baat ya suggestion' },
];

const statusLabels: Record<FeedbackItem['status'], string> = {
  new: 'Pending',
  reviewed: 'Under Review',
  resolved: 'Resolved',
};

const statusVariant: Record<FeedbackItem['status'], 'default' | 'secondary' | 'outline'> = {
  new: 'default',
  reviewed: 'secondary',
  resolved: 'outline',
};

export default function FeedbackPage() {
  const pathname = usePathname();
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [myFeedback, setMyFeedback] = useState<FeedbackItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    api<ApiSuccess<FeedbackItem[]>>('/feedback/mine')
      .then((res) => setMyFeedback(res.data))
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [success]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!subject.trim()) {
      setError('Subject likhna zaroori hai');
      return;
    }
    if (message.trim().length < 10) {
      setError('Message kam se kam 10 characters ka hona chahiye');
      return;
    }

    setSubmitting(true);
    try {
      await api('/feedback', {
        method: 'POST',
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
          pageUrl: typeof window !== 'undefined' ? window.location.origin + pathname : undefined,
        }),
      });
      setSuccess(true);
      setSubject('');
      setMessage('');
      setCategory('bug');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit nahi ho paya, dobara try karein');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-3xl">
      <div>
        <p className="text-sm font-medium text-primary">MentorsDaily ExamPrep Pro</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Feedback</h1>
        <p className="mt-1 text-muted-foreground">
          Bataiye kya update chahiye, kya kaam nahi kar raha, ya koi suggestion hai — admin team dekh legi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            Send Feedback
          </CardTitle>
          <CardDescription>
            Apna issue ya suggestion detail mein likhein taaki hum jaldi fix kar saken.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Feedback submit ho gaya! Admin team jald review karegi.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium">Category</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    className={cn(
                      'rounded-lg border p-3 text-left transition-colors',
                      category === opt.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="subject">
                Subject
              </label>
              <Input
                id="subject"
                className="mt-1"
                placeholder="e.g. Mock test submit button kaam nahi kar raha"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="message">
                Details
              </label>
              <textarea
                id="message"
                className="mt-1 min-h-[140px] w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Problem kya hai, kaise reproduce karein, ya kya improvement chahiye — detail mein likhein..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={5000}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting} className="gap-2">
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {myFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Previous Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingHistory ? (
              <ListSkeleton count={3} />
            ) : (
              myFeedback.map((item) => (
                <div key={item._id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.subject}</p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.message}</p>
                    </div>
                    <Badge variant={statusVariant[item.status]}>{statusLabels[item.status]}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
