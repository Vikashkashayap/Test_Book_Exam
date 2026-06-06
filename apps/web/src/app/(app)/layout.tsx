import { StudentAppShell } from '@/components/layout/StudentAppShell';

export default function StudentAppLayout({ children }: { children: React.ReactNode }) {
  return <StudentAppShell>{children}</StudentAppShell>;
}
