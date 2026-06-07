import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CircleHelp, FileText, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stats = [
  { value: '10K+', label: 'Questions', icon: CircleHelp },
  { value: '500+', label: 'Mock Tests', icon: FileText },
  { value: '50K+', label: 'Students', icon: Users },
  { value: '98%', label: 'Satisfaction', icon: ShieldCheck },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#071428] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image
          src="/branding/hero-banner.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[75%_center] sm:object-[80%_center] md:object-right-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071428] from-0% via-[#071428]/95 via-42% to-[#071428]/15 to-100% sm:via-[#071428]/90 sm:via-50%" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#071428] to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto px-6 pb-10 pt-14 sm:px-8 sm:pb-12 sm:pt-16 md:px-10 md:pb-14 md:pt-20 lg:px-14 lg:pt-24">
        <div className="max-w-2xl space-y-7 sm:space-y-8 md:space-y-9">
          <span className="inline-flex items-center rounded-full border border-sky-400/25 bg-sky-500/10 px-5 py-2 text-sm font-medium text-sky-100 sm:text-base">
            Abhyas by MentorsDaily ExamPrep Pro
          </span>

          <h1 className="text-[2.35rem] font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-[3.25rem] lg:text-6xl lg:leading-[1.08]">
            Crack SSC, Banking, UPSC &{' '}
            <span className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent">
              40+ Govt Exams
            </span>
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-blue-100/90 sm:max-w-xl sm:text-lg md:text-xl md:leading-relaxed">
            Full-length mocks, AI-powered analysis, current affairs, and an exam interface built
            like Testbook & Oliveboard — all in one platform.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-11 w-full rounded-full bg-white px-7 text-[0.95rem] font-semibold text-[#0b3d91] shadow-lg shadow-blue-950/30 hover:bg-white/90 sm:h-12 sm:w-auto sm:px-8 sm:text-base"
                >
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 w-full rounded-full border-2 border-white/45 bg-white/5 px-7 text-[0.95rem] text-white hover:bg-white/10 hover:text-white sm:h-12 sm:w-auto sm:px-8 sm:text-base"
                >
                  View Plans
                </Button>
              </Link>
            </div>

          <div className="border-t border-white/10 pt-8 sm:pt-9">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-x-3 md:gap-x-4">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-2 sm:gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/15 ring-1 ring-sky-400/20 sm:h-10 sm:w-10">
                    <s.icon className="h-4 w-4 text-sky-300 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-base font-bold leading-tight sm:text-lg md:text-xl">{s.value}</div>
                    <div className="text-[11px] text-blue-200/75 sm:text-xs md:text-sm">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
