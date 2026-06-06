export type AuthPortal = 'student' | 'admin';

export function isAdminRole(role?: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function getHomePath(role?: string): string {
  return isAdminRole(role) ? '/admin' : '/dashboard';
}

export function getLoginPath(_portal?: AuthPortal): string {
  return '/login';
}

/** Safe in-app redirect target from query params */
export function getSafeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  return value;
}
