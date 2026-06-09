'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/user';

export default function MarketPage() {
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
        <h1 className="text-4xl font-bold mb-2">SofStake Market</h1>
        <p className="text-slate-400">Internal marketplace and trading</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-6">
          <h3 className="font-semibold text-lg mb-4">SofCoin Trading</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400">Current Price</p>
              <p className="text-2xl font-bold">₦0.50</p>
            </div>
            <button className="w-full py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
              Buy SofCoins
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 p-6">
          <h3 className="font-semibold text-lg mb-4">NFT Trading</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400">Collections</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <button className="w-full py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
              Explore NFTs
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6">
        <h3 className="font-semibold text-lg mb-4">Market Trends</h3>
        <p className="text-slate-400">No trading activity yet. Start earning SofCoins to begin trading!</p>
      </div>
    </div>
  );
}
