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
      className="inline-flex items-center gap-4 rounded-full border border-white/15 bg-white px-5 py-2.5 transition-all hover:border-white/25 hover:bg-white/95"
      aria-label="Visit VedixLab — Technology Partner"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Technology Partner
      </span>
      <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
      <Image
        src="/partners/vedixlab-logo.png"
        alt="VedixLab"
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
    <footer className="border-t border-white/10 bg-[#071428] text-white">
      {!isStudentApp && (
        <div className="container mx-auto px-4 py-12 md:px-6 md:py-16 lg:px-10">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4 lg:col-span-1">
              <Link href="/" className="inline-flex items-center">
                <Image
                  src="/branding/mentorsdaily-logo.png"
                  alt="MentorsDaily"
                  width={160}
                  height={40}
                  className="h-9 w-auto object-contain"
                />
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-blue-100/75">
                Smart mock tests, AI coaching, and analytics for SSC, Banking, UPSC, and 40+ government
                exams — built for serious aspirants.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-100/80">
                  <Mail className="h-4 w-4 shrink-0 text-sky-400" />
                  <span>contact@mentorsdaily.com</span>
                </div>
                <p className="text-xs text-blue-200/50">
                  © {new Date().getFullYear()} Abhyas by MentorsDaily ExamPrep Pro. All rights reserved.
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-sky-300">
                Platform
              </h3>
              <ul className="space-y-2.5">
                {platformLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-blue-100/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-300">
                <GraduationCap className="h-3.5 w-3.5" />
                Popular Exams
              </h3>
              <ul className="space-y-2.5">
                {examLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-blue-100/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-sky-300">
                Account
              </h3>
              <ul className="space-y-2.5">
                {accountLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-blue-100/70 transition-colors hover:text-white"
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

      <div className="border-t border-white/10 bg-[#050f1f]/80">
        <div className="container mx-auto flex justify-center px-4 py-6">
          <TechnologyPartnerBadge />
        </div>
      </div>
    </footer>
  );
}
