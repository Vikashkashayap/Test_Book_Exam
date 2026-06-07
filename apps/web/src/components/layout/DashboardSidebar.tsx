'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Bookmark,
  Newspaper,
  FileText,
  Bot,
  Settings,
  History,
  MessageSquarePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSidebarLinkActive } from '@/lib/sidebar-utils';
import type { SidebarLinkItem } from '@/components/layout/MobileSidebarNav';

export const studentSidebarLinks: SidebarLinkItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tests', label: 'My Tests', icon: BookOpen },
  { href: '/history', label: 'History', icon: History },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/current-affairs', label: 'Current Affairs', icon: Newspaper },
  { href: '/study-materials', label: 'Study Materials', icon: FileText },
  { href: '/ai-mentor', label: 'AI Mentor', icon: Bot },
  { href: '/feedback', label: 'Feedback', icon: MessageSquarePlus },
  { href: '/profile', label: 'Profile', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r bg-card/50 lg:flex">
      <div className="shrink-0 border-b px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Student Portal
        </p>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [scrollbar-width:thin]">
        <div className="space-y-0.5">
          {studentSidebarLinks.map((link) => {
            const active = isSidebarLinkActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[40px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
