import type { Metadata } from 'next';
import './globals.css';
import { Topbar } from '@/components/site/topbar';
import { Sidebar } from '@/components/site/sidebar';
import { Shell } from '@/components/site/Shell';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'SofStake',
  description: 'Real-time multiplayer skill betting platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        <Providers>
          <Topbar />
          <Sidebar />
          <Shell>
            <div className="p-6">
              {children}
            </div>
          </Shell>
        </Providers>
      </body>
    </html>
  );
}
