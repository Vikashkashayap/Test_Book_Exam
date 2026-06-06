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
  HelpCircle,
  Sparkles,
  Bot,
  Megaphone,
  IndianRupee,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SidebarLinkItem } from '@/components/layout/MobileSidebarNav';

export const adminSidebarLinks: SidebarLinkItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/ai-questions', label: 'AI Questions', icon: Sparkles },
  { href: '/admin/tests/create', label: 'Schedule Mock', icon: Bot },
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
    <aside className="hidden h-full min-h-0 w-64 shrink-0 flex-col border-r bg-card/50 p-4 lg:flex">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Admin Portal
      </p>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {adminSidebarLinks.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== '/admin' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/dashboard"
        className="flex min-h-[44px] items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <HelpCircle className="h-3 w-3" /> Student portal
      </Link>
    </aside>
  );
}
