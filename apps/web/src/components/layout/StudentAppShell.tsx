'use client';

import { usePathname } from 'next/navigation';
import { DashboardSidebar, studentSidebarLinks } from '@/components/layout/DashboardSidebar';
import { MobileSidebarNav } from '@/components/layout/MobileSidebarNav';
import { ScrollLock } from '@/components/layout/ScrollLock';
import { RequireAuth } from '@/components/guards/RequireAuth';

export function StudentAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAttempt = pathname.includes('/attempt');
  const isFullHeightPage = pathname.startsWith('/ai-mentor');

  if (isAttempt) {
    return (
      <RequireAuth portal="student">
        <div className="min-h-[100dvh] overflow-x-hidden">{children}</div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth portal="student">
      <ScrollLock />
      <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden">
        <MobileSidebarNav links={studentSidebarLinks} title="Student Portal" />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <DashboardSidebar />
          <main
            className={
              isFullHeightPage
                ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
                : 'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto'
            }
          >
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
