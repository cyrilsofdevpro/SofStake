'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/user';
import TrendingTokens from '@/components/crypto/TrendingTokens';
import TokenSearch from '@/components/crypto/TokenSearch';

export default function CryptoMarketPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/auth');
      return;
    }
    setUser(storedUser);
  }, [router]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Crypto Market</h1>
        <p className="text-slate-400">Real-time cryptocurrency prices and trends (powered directly by DexScreener)</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Search */}
          <div className="mb-6">
            <TokenSearch />
          </div>

          {/* Trending */}
          <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6">
            <TrendingTokens />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl bg-slate-900/50 border border-white/5 p-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="mt-3 space-y-2">
              <a className="block text-cyan-300" href="/crypto-betting">Crypto Betting (Coming Soon)</a>
              <a className="block text-cyan-300" href="/crypto-market">Refresh Market</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
