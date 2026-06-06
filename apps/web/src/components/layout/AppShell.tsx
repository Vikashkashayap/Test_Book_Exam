'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { TopOfferBar } from '@/components/layout/TopOfferBar';

const FULLSCREEN_ROUTES = ['/attempt'];

function isFullscreenRoute(pathname: string) {
  return FULLSCREEN_ROUTES.some((segment) => pathname.includes(segment));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = isFullscreenRoute(pathname);

  return (
    <>
      {!hideChrome && <TopOfferBar />}
      {!hideChrome && <Navbar />}
      {children}
      {!hideChrome && <Footer />}
    </>
  );
}
