'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { getLoginPath, isAdminRole, type AuthPortal } from '@/lib/auth-utils';

interface Props {
  children: React.ReactNode;
  portal: AuthPortal;
}

export function RequireAuth({ children, portal }: Props) {
  const router = useRouter();
  const { user, fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (user === null && typeof window !== 'undefined') {
      const hasToken = localStorage.getItem('accessToken');
      if (!hasToken) {
        router.replace(getLoginPath(portal));
        return;
      }
    }

    if (user) {
      const userIsAdmin = isAdminRole(user.role);
      if (portal === 'admin' && !userIsAdmin) {
        router.replace('/dashboard');
      }
      if (portal === 'student' && userIsAdmin) {
        router.replace('/admin');
      }
    }
  }, [user, portal, router]);

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (portal === 'admin' && !isAdminRole(user.role)) return null;
  if (portal === 'student' && isAdminRole(user.role)) return null;

  return <>{children}</>;
}
