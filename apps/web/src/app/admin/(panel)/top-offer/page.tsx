'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, ApiSuccess } from '@/lib/api';
import type { TopOfferData } from '@/components/layout/TopOfferBar';
import { cn } from '@/lib/utils';

const defaultForm = {
  headline: 'Limited Time Offer',
  message: 'Get exclusive discounts on our courses. One conversation can change your journey!',
  badgeText: '25% OFF',
  ctaText: 'Claim Offer',
  ctaUrl: '/pricing',
  isEnabled: true,
};

export default function AdminTopOfferPage() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api<ApiSuccess<TopOfferData | null>>('/admin/top-offer')
      .then((res) => {
        if (res.data) {
          setForm({
            headline: res.data.headline,
            message: res.data.message,
            badgeText: res.data.badgeText,
            ctaText: res.data.ctaText,
            ctaUrl: res.data.ctaUrl,
            isEnabled: res.data.isEnabled,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api<ApiSuccess<TopOfferData>>('/admin/top-offer', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setMessage('Offer banner published successfully');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-x-hidden space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <p className="text-sm font-medium text-primary">MentorsDaily ExamPrep Pro</p>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <Megaphone className="h-7 w-7 text-orange-500" />
          Top Offer Banner
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Post an offer that appears above the navbar in orange — visible to all visitors
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Publish Offer</CardTitle>
            <CardDescription>Update text and toggle visibility on the website</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </p>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Headline (bold)</label>
                  <Input
                    className="mt-1"
                    value={form.headline}
                    onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                    placeholder="Limited Time Offer"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message (scrolling text)</label>
                  <Input
                    className="mt-1"
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Get exclusive discounts..."
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Badge text</label>
                    <Input
                      className="mt-1"
                      value={form.badgeText}
                      onChange={(e) => setForm((f) => ({ ...f, badgeText: e.target.value }))}
                      placeholder="25% OFF"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Button text</label>
                    <Input
                      className="mt-1"
                      value={form.ctaText}
                      onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
                      placeholder="Claim Offer"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Button link</label>
                  <Input
                    className="mt-1"
                    value={form.ctaUrl}
                    onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                    placeholder="/pricing"
                  />
                </div>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3">
                  <input
                    type="checkbox"
                    checked={form.isEnabled}
                    onChange={(e) => setForm((f) => ({ ...f, isEnabled: e.target.checked }))}
                    className="h-4 w-4 accent-orange-500"
                  />
                  <span className="text-sm font-medium">Show banner on website</span>
                </label>
                <Button type="submit" className="min-h-[44px] w-full sm:w-auto" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Publish Offer'
                  )}
                </Button>
                {message ? (
                  <p
                    className={cn(
                      'text-sm',
                      message.includes('success') ? 'text-green-600' : 'text-destructive'
                    )}
                  >
                    {message}
                  </p>
                ) : null}
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>How it will look above the navbar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 overflow-hidden rounded-lg border p-0">
            <div className="overflow-hidden bg-orange-500 px-3 py-2.5 text-white">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold">{form.headline || 'Headline'}</span>
                <span className="truncate opacity-90">{form.message || 'Your message here'}</span>
                {form.badgeText ? (
                  <span className="shrink-0 rounded bg-amber-300 px-2 py-0.5 text-xs font-bold text-slate-900">
                    {form.badgeText}
                  </span>
                ) : null}
                {form.ctaText ? (
                  <span className="ml-auto shrink-0 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-orange-600">
                    {form.ctaText}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="border-b bg-background px-4 py-3 text-sm text-muted-foreground">
              Navbar appears below this banner
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
