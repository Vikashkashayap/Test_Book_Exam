'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { GraduationCap, Mail } from 'lucide-react';

const platformLinks = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/#features', label: 'Features' },
  { href: '/register', label: 'Get Started' },
];

const examLinks = [
  { href: '/register', label: 'SSC CGL & CHSL' },
  { href: '/register', label: 'Banking & Insurance' },
  { href: '/register', label: 'Railway & Defence' },
  { href: '/register', label: 'UPSC & State PCS' },
];

const accountLinks = [
  { href: '/login', label: 'Login' },
  { href: '/register', label: 'Create Account' },
];

const studentAppPrefixes = [
  '/dashboard',
  '/tests',
  '/bookmarks',
  '/leaderboard',
  '/current-affairs',
  '/study-materials',
  '/ai-mentor',
  '/profile',
  '/results',
];

function TechnologyPartnerBadge() {
  return (
    <a
      href="https://vedixlab.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-4 rounded-full border border-slate-200 bg-white px-5 py-2.5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
      aria-label="Visit VedixLab — Technology Partner"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Technology Partner
      </span>
      <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
      <Image
        src="/partners/vedixlab-logo.png"
        alt="Vedixlab"
        width={96}
        height={28}
        className="h-6 w-auto object-contain"
      />
    </a>
  );
}

export function Footer() {
  const pathname = usePathname();

  const isStudentApp = studentAppPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (pathname.startsWith('/admin') || pathname.includes('/attempt') || isStudentApp) {
    return null;
  }

  return (
    <footer className="border-t bg-slate-50">
      {!isStudentApp && (
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground shadow-sm">
                  EP
                </span>
                MentorsDaily
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
                Smart mock tests, AI coaching, and analytics for SSC, Banking, UPSC, and 40+ government
                exams — built for serious aspirants.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <span>support@mentorsdaily.com</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  © {new Date().getFullYear()} MentorsDaily ExamPrep Pro. All rights reserved.
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                Platform
              </h3>
              <ul className="space-y-2.5">
                {platformLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                <GraduationCap className="h-3.5 w-3.5" />
                Popular Exams
              </h3>
              <ul className="space-y-2.5">
                {examLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                Account
              </h3>
              <ul className="space-y-2.5">
                {accountLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-slate-200/80 bg-white/60">
        <div className="container mx-auto flex justify-center px-4 py-6">
          <TechnologyPartnerBadge />
        </div>
      </div>
    </footer>
  );
}
