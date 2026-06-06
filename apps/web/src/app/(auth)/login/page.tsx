'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Sign in to your account — students and admins use the same login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {reason === 'subscribe' && (
              <p className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                Please sign in to subscribe and pay via Razorpay.
              </p>
            )}
            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
            )}
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="min-h-[44px] w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New student?{' '}
            <Link
              href={
                redirect
                  ? `/register?redirect=${encodeURIComponent(redirect)}${reason ? `&reason=${reason}` : ''}`
                  : '/register'
              }
              className="font-medium text-primary hover:underline"
            >
              Register free
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
