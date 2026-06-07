'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, ApiSuccess } from '@/lib/api';
import { useExamEcosystem, type ExamGroup } from '@/hooks/use-exams';
import { cn } from '@/lib/utils';
import { AuthPageLayout, authCardClass, authInputClass } from '@/components/auth/AuthPageLayout';

function RegisterWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = Number(searchParams.get('step') || 1);
  const { data: ecosystem, isLoading } = useExamEcosystem();

  const [step, setStep] = useState(initialStep > 2 ? 2 : initialStep);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);

  useEffect(() => {
    if (initialStep > 1 && !localStorage.getItem('accessToken')) {
      setStep(1);
    }
  }, [initialStep]);

  const allExams = useMemo(
    () =>
      (ecosystem ?? [])
        .flatMap((group) => group.exams)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [ecosystem]
  );

  async function handleStep1() {
    setError('');
    setLoading(true);
    try {
      const res = await api<ApiSuccess<{ accessToken: string }>>('/onboarding/step-1', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone }),
      });
      localStorage.setItem('accessToken', res.data.accessToken);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    if (!selectedExams.length) {
      setError('Kam se kam ek exam select karo');
      return;
    }

    const categorySlugs = [
      ...new Set(
        (ecosystem ?? []).flatMap((g: ExamGroup) =>
          g.exams.some((e) => selectedExams.includes(e.slug)) ? [g.slug] : []
        )
      ),
    ];

    setLoading(true);
    setError('');
    try {
      await api('/onboarding/step-2', {
        method: 'POST',
        body: JSON.stringify({ categorySlugs }),
      });
      await api('/onboarding/step-3', {
        method: 'POST',
        body: JSON.stringify({ examSlugs: selectedExams }),
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  }

  function toggleExam(slug: string) {
    setSelectedExams((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  return (
    <AuthPageLayout centered={false}>
      <div className="container mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Join Abhyas by MentorsDaily ExamPrep Pro
        </h1>
        <div className="mt-6 flex justify-center gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium',
                step >= s
                  ? 'border-sky-400 bg-sky-500 text-white'
                  : 'border-white/20 text-blue-200/50'
              )}
            >
              {step > s ? <Check className="h-5 w-5" /> : s}
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-sm text-blue-100/70">
          Step {step} of 2 — {step === 1 ? 'Basic Details' : 'Choose Your Exam'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className={authCardClass}>
            <CardHeader>
              <CardTitle className="text-white">
                {step === 1 && 'Your Details'}
                {step === 2 && 'Kis exam ki taiyari kar rahe ho?'}
              </CardTitle>
              <CardDescription className="text-blue-100/70">
                {step === 2 && 'Apna target exam select karo — dashboard usi ke hisaab se khulega'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <p className="rounded-md border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </p>
              )}

              {step === 1 && (
                <>
                  <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className={authInputClass} />
                  <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={authInputClass} />
                  <Input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} className={authInputClass} />
                  <Input
                    type="password"
                    placeholder="Password (min 8 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    className={authInputClass}
                  />
                  <Button
                    className="w-full rounded-full bg-white font-semibold text-[#0b3d91] hover:bg-white/90"
                    onClick={handleStep1}
                    disabled={loading || !name || !email || !password}
                  >
                    Continue <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  {isLoading ? (
                    <p className="text-sm text-blue-100/70">Loading exams...</p>
                  ) : (
                    <div className="grid max-h-[28rem] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {allExams.map((exam) => (
                        <button
                          key={exam.slug}
                          type="button"
                          onClick={() => toggleExam(exam.slug)}
                          className={cn(
                            'rounded-lg border p-3 text-left text-sm transition-colors',
                            selectedExams.includes(exam.slug)
                              ? 'border-sky-400/50 bg-sky-500/15 font-medium text-white'
                              : 'border-white/10 text-blue-100/80 hover:border-white/20 hover:bg-white/5'
                          )}
                        >
                          {exam.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedExams.length > 0 && (
                    <p className="text-sm text-blue-100/70">
                      Selected: {selectedExams.length} exam(s)
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                      onClick={() => setStep(1)}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" /> Back
                    </Button>
                    <Button
                      className="flex-1 rounded-full bg-white font-semibold text-[#0b3d91] hover:bg-white/90"
                      onClick={handleStep2}
                      disabled={loading || !selectedExams.length}
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <p className="mt-6 text-center text-sm text-blue-100/70">
        Already registered?{' '}
        <Link href="/login" className="font-medium text-sky-300 hover:text-white hover:underline">
          Sign in
        </Link>
      </p>
      </div>
    </AuthPageLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AuthPageLayout centered={false}>
          <p className="text-center text-blue-100/70">Loading...</p>
        </AuthPageLayout>
      }
    >
      <RegisterWizard />
    </Suspense>
  );
}
