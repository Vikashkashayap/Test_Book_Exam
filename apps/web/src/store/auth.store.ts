import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, ApiSuccess } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  subscriptionPlan: string;
  points?: number;
  streak?: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; name: string }) => Promise<User>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    email: String(raw.email ?? ''),
    name: String(raw.name ?? ''),
    role: String(raw.role ?? 'student'),
    avatar: raw.avatar as string | undefined,
    subscriptionPlan: String(raw.subscriptionPlan ?? 'free'),
    points: raw.points as number | undefined,
    streak: raw.streak as number | undefined,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      setUser: (user) => set({ user }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api<ApiSuccess<{ user: User; accessToken: string }>>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });
          localStorage.setItem('accessToken', res.data.accessToken);
          const user = normalizeUser(res.data.user as unknown as Record<string, unknown>);
          set({ user });
          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api<ApiSuccess<{ user: User; accessToken: string }>>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          localStorage.setItem('accessToken', res.data.accessToken);
          const user = normalizeUser(res.data.user as unknown as Record<string, unknown>);
          set({ user });
          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api('/auth/logout', { method: 'POST' });
        } catch {
          /* ignore */
        }
        localStorage.removeItem('accessToken');
        set({ user: null });
      },

      fetchMe: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
          set({ user: null });
          return;
        }
        try {
          const res = await api<ApiSuccess<Record<string, unknown>>>('/auth/me');
          set({ user: normalizeUser(res.data) });
        } catch {
          localStorage.removeItem('accessToken');
          set({ user: null });
        }
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user }) }
  )
);
