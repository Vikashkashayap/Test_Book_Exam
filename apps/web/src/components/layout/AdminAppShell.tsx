'use client';

import { AdminSidebar, adminSidebarLinks } from '@/components/layout/AdminSidebar';
import { MobileSidebarNav } from '@/components/layout/MobileSidebarNav';
import { ScrollLock } from '@/components/layout/ScrollLock';
import { RequireAuth } from '@/components/guards/RequireAuth';

export function AdminAppShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth portal="admin">
      <ScrollLock />
      <div className="flex h-[calc(100dvh-4rem-var(--top-offer-height,0px))] max-h-[calc(100dvh-4rem-var(--top-offer-height,0px))] min-h-0 flex-col overflow-hidden">
        <MobileSidebarNav links={adminSidebarLinks} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <AdminSidebar />
          <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
