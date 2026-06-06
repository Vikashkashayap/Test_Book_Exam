'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { isAdminRole } from '@/lib/auth-utils';

const publicLinks = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/#features', label: 'Features' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuth = !!user;
  const onAdminRoute = pathname.startsWith('/admin');
  const userIsAdmin = isAdminRole(user?.role);
  const isMarketing = !isAuth && !onAdminRoute;

  // Logged-in users navigate via sidebar (student/admin portal) — no duplicate top links
  const navLinks = isAuth ? [] : publicLinks;
  const showMobileMenu = !isAuth && navLinks.length > 0;

  const homeHref =
    userIsAdmin && onAdminRoute ? '/admin' : userIsAdmin ? '/admin' : isAuth ? '/dashboard' : '/';

  const isLinkActive = (href: string) => {
    if (href.startsWith('/#')) return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 border-b backdrop-blur-md',
          isMarketing
            ? 'border-slate-200/70 bg-white/90 shadow-[0_1px_3px_rgba(15,23,42,0.06)] backdrop-blur-xl'
            : 'border-border bg-background/80'
        )}
      >
        <div className="container relative mx-auto flex h-16 items-center justify-between px-4">
          <Link href={homeHref} className="z-10 flex items-center gap-2.5 text-xl font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground shadow-sm">
              EP
            </span>
            <span className="hidden tracking-tight sm:inline">MentorsDaily</span>
          </Link>

          {navLinks.length > 0 && (
            <nav
              className={cn(
                'hidden items-center gap-1 md:flex',
                isMarketing && 'absolute left-1/2 -translate-x-1/2'
              )}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isLinkActive(link.href)
                      ? isMarketing
                        ? 'bg-primary/10 text-primary'
                        : 'text-primary'
                      : isMarketing
                        ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="z-10 flex items-center gap-2">
            {showMobileMenu && (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}

            <div className={cn('items-center gap-2', isAuth ? 'flex' : 'hidden md:flex')}>
              {isAuth ? (
                <>
                  {userIsAdmin && !onAdminRoute && (
                    <Link href="/admin">
                      <Button variant="outline" size="sm" className="min-h-[44px] gap-1">
                        <Shield className="h-4 w-4" /> Admin
                      </Button>
                    </Link>
                  )}
                  {!userIsAdmin && (
                    <Link href="/profile">
                      <Button variant="ghost" size="icon" className="h-11 w-11">
                        <User className="h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px]"
                    onClick={async () => {
                      await logout();
                      window.location.href = '/login';
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn('min-h-[44px]', isMarketing && 'text-slate-600 hover:text-slate-900')}
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className={cn('min-h-[44px]', isMarketing && 'shadow-md shadow-primary/25')}>
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {showMobileMenu && mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Mobile menu">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(100%,300px)] flex-col bg-background shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <span className="font-semibold">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm font-medium',
                    isLinkActive(link.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="space-y-2 border-t p-4">
              {isAuth ? (
                <>
                  {userIsAdmin && !onAdminRoute && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="min-h-[44px] w-full justify-start gap-2">
                        <Shield className="h-4 w-4" /> Admin Panel
                      </Button>
                    </Link>
                  )}
                  {!userIsAdmin && (
                    <Link href="/profile" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="min-h-[44px] w-full justify-start gap-2">
                        <User className="h-4 w-4" /> Profile
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    className="min-h-[44px] w-full"
                    onClick={async () => {
                      setMobileOpen(false);
                      await logout();
                      window.location.href = '/login';
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="min-h-[44px] w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="min-h-[44px] w-full">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
