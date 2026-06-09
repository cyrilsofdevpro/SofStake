'use client';

import { usePathname } from 'next/navigation';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  return (
    <main className={`${isLandingPage ? 'ml-0 pt-0' : 'ml-64 pt-20'} min-h-screen transition-all`}>
      {children}
    </main>
  );
}
