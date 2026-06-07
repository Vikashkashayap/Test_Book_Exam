'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  Bot,
  Megaphone,
  IndianRupee,
  MessageSquare,
  FileText,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSidebarLinkActive } from '@/lib/sidebar-utils';
import type { SidebarLinkItem } from '@/components/layout/MobileSidebarNav';

export const adminSidebarLinks: SidebarLinkItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/tests/create', label: 'Schedule Mock', icon: Bot },
  { href: '/admin/pyq', label: 'PYQ Papers', icon: FileText },
  { href: '/admin/blogs', label: 'Blogs', icon: BookOpen },
  { href: '/admin/top-offer', label: 'Top Offer', icon: Megaphone },
  { href: '/admin/pricing', label: 'Pricing Plans', icon: IndianRupee },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r bg-card/50 lg:flex">
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 pt-4 [scrollbar-width:thin]">
        <div className="space-y-0.5">
          {adminSidebarLinks.map((link) => {
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
