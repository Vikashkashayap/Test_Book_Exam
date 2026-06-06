import { AdminAppShell } from '@/components/layout/AdminAppShell';

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminAppShell>{children}</AdminAppShell>;
}
