'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isSidebarLinkActive } from '@/lib/sidebar-utils';

export interface SidebarLinkItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  links: SidebarLinkItem[];
  title?: string;
  footerLink?: { href: string; label: string; icon: LucideIcon };
}

function isLinkActive(pathname: string, href: string) {
  return isSidebarLinkActive(pathname, href);
}

export function MobileSidebarNav({ links, title, footerLink }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {title ? <span className="truncate text-sm font-semibold">{title}</span> : null}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(100%,280px)] flex-col border-r bg-card shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              {title ? (
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
              ) : (
                <p className="text-sm font-semibold">Menu</p>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {links.map((link) => {
                const active = isLinkActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <link.icon className="h-4 w-4 shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            {footerLink && (
              <Link
                href={footerLink.href}
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center gap-2 border-t px-4 py-3 text-xs text-muted-foreground hover:text-foreground"
              >
                <footerLink.icon className="h-3 w-3" />
                {footerLink.label}
              </Link>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
