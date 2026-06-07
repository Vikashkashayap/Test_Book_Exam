'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthPageLayout, authCardClass, authInputClass, authLabelClass } from '@/components/auth/AuthPageLayout';
import { useAuthStore } from '@/store/auth.store';
import { getHomePath, getSafeRedirectPath } from '@/lib/auth-utils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const reason = searchParams.get('reason');
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      const destination = getSafeRedirectPath(redirect, getHomePath(user.role));
      router.push(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <AuthPageLayout>
      <Card className={`w-full max-w-md ${authCardClass}`}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Login</CardTitle>
          <CardDescription className="text-blue-100/70">
            Sign in to your account — students and admins use the same login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {reason === 'subscribe' && (
              <p className="rounded-md border border-sky-400/20 bg-sky-500/10 p-3 text-sm text-sky-200">
                Please sign in to subscribe and pay via Razorpay.
              </p>
            )}
            {error && (
              <p className="rounded-md border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </p>
            )}
            <div>
              <label className={authLabelClass}>Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={authInputClass}
                autoComplete="email"
              />
            </div>
            <div>
              <label className={authLabelClass}>Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={authInputClass}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="min-h-[44px] w-full rounded-full bg-white font-semibold text-[#0b3d91] hover:bg-white/90"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-blue-100/70">
            New student?{' '}
            <Link
              href={
                redirect
                  ? `/register?redirect=${encodeURIComponent(redirect)}${reason ? `&reason=${reason}` : ''}`
                  : '/register'
              }
              className="font-medium text-sky-300 hover:text-white hover:underline"
            >
              Register free
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthPageLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthPageLayout>
          <p className="text-blue-100/70">Loading...</p>
        </AuthPageLayout>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
