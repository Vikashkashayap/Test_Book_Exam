'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { api, ApiSuccess } from '@/lib/api';
import { cn } from '@/lib/utils';

export type TopOfferData = {
  _id: string;
  headline: string;
  message: string;
  badgeText: string;
  ctaText: string;
  ctaUrl: string;
  isEnabled: boolean;
  updatedAt?: string;
};

const DISMISS_KEY = 'md-top-offer-dismissed';

export function TopOfferBar() {
  const [offer, setOffer] = useState<TopOfferData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api<ApiSuccess<TopOfferData | null>>('/content/top-offer')
      .then((res) => {
        const data = res.data;
        if (!data?.isEnabled) {
          setOffer(null);
          return;
        }
        setOffer(data);
        const dismissedId = localStorage.getItem(DISMISS_KEY);
        setDismissed(dismissedId === `${data._id}:${data.updatedAt ?? ''}`);
      })
      .catch(() => setOffer(null));
  }, []);

  useEffect(() => {
    if (!offer || dismissed) {
      document.documentElement.style.setProperty('--top-offer-height', '0px');
      return;
    }
    document.documentElement.style.setProperty('--top-offer-height', '44px');
    return () => {
      document.documentElement.style.setProperty('--top-offer-height', '0px');
    };
  }, [offer, dismissed]);

  function handleDismiss() {
    if (!offer) return;
    localStorage.setItem(DISMISS_KEY, `${offer._id}:${offer.updatedAt ?? ''}`);
    setDismissed(true);
  }

  if (!offer || dismissed) return null;

  const marqueeContent = (
    <>
      <span className="font-bold">{offer.headline}</span>
      <span className="mx-3 opacity-90">{offer.message}</span>
      {offer.badgeText ? (
        <span className="mx-2 rounded bg-amber-300 px-2 py-0.5 text-xs font-bold text-slate-900">
          {offer.badgeText}
        </span>
      ) : null}
    </>
  );

  return (
    <div className="relative z-[60] overflow-hidden bg-orange-500 text-white">
      <div className="mx-auto flex min-h-[44px] max-w-[100vw] items-center gap-3 px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap text-sm sm:text-[15px]">
            <span className="inline-flex shrink-0 items-center pr-12">{marqueeContent}</span>
            <span className="inline-flex shrink-0 items-center pr-12" aria-hidden="true">
              {marqueeContent}
            </span>
            <span className="inline-flex shrink-0 items-center pr-12" aria-hidden="true">
              {marqueeContent}
            </span>
          </div>
        </div>

        {offer.ctaText && (
          <Link
            href={offer.ctaUrl || '/pricing'}
            className={cn(
              'hidden shrink-0 rounded-full bg-white/95 px-4 py-1.5 text-sm font-semibold text-orange-600',
              'transition-colors hover:bg-white sm:inline-flex'
            )}
          >
            {offer.ctaText}
          </Link>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/90 hover:bg-white/15 hover:text-white"
          aria-label="Dismiss offer banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {offer.ctaText && (
        <div className="border-t border-white/20 px-3 pb-2 sm:hidden">
          <Link
            href={offer.ctaUrl || '/pricing'}
            className="mt-2 flex min-h-[40px] w-full items-center justify-center rounded-full bg-white/95 text-sm font-semibold text-orange-600"
          >
            {offer.ctaText}
          </Link>
        </div>
      )}
    </div>
  );
}
