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
    <aside className="hidden h-full min-h-0 w-64 shrink-0 flex-col border-r bg-card/50 p-4 lg:flex">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Student Portal
      </p>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {studentSidebarLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              (link.href === '/history'
                ? pathname === '/history' || pathname.startsWith('/results/')
                : pathname === link.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
