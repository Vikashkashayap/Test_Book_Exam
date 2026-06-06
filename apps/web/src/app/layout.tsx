import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'MentorsDaily ExamPrep Pro | SSC, Banking, UPSC Mock Tests',
  description:
    'Production-ready test series for SSC, Banking, Railway, Police, Defence, Teaching, UPSC & State PCS. AI mentor, PYQ, current affairs & personalized dashboard.',
  keywords: ['SSC CGL', 'Banking', 'UPSC', 'mock test', 'Testbook alternative', 'MentorsDaily'],
  openGraph: {
    title: 'MentorsDaily ExamPrep Pro',
    description: 'Crack government exams with smart mocks & AI coaching',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={`${inter.variable} overflow-x-hidden antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
