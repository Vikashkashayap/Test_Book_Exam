export const authCardClass =
  'border-white/10 bg-[#0d1f3c]/95 text-white shadow-xl shadow-black/25 backdrop-blur-sm';

export const authInputClass =
  'mt-1 border-white/15 bg-white/5 text-white placeholder:text-blue-200/40 focus-visible:ring-sky-400';

export const authLabelClass = 'text-sm font-medium text-blue-100';

export function AuthPageLayout({
  children,
  centered = true,
}: {
  children: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#071428] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#071428] via-[#0a1a30] to-[#071428]"
        aria-hidden="true"
      />
      <div
        className={
          centered
            ? 'relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12'
            : 'relative px-4 py-12'
        }
      >
        {children}
      </div>
    </div>
  );
}
