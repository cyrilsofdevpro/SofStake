'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/user';

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
        <p className="text-slate-400">Real-time cryptocurrency prices and trends</p>
      </div>

      <div className="rounded-xl bg-slate-900/50 border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-slate-800/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">24h Change</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Market Cap</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Bitcoin', symbol: 'BTC', price: '$43,200', change: '+2.5%', cap: '$845B' },
                { name: 'Ethereum', symbol: 'ETH', price: '$2,300', change: '+1.8%', cap: '$276B' },
                { name: 'Solana', symbol: 'SOL', price: '$98.25', change: '+5.2%', cap: '$42.5B' },
                { name: 'Ripple', symbol: 'XRP', price: '$0.52', change: '-1.2%', cap: '$28.3B' },
                { name: 'Cardano', symbol: 'ADA', price: '$0.78', change: '+3.4%', cap: '$27.8B' },
              ].map((coin) => (
                <tr key={coin.symbol} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold">{coin.name}</p>
                      <p className="text-xs text-slate-400">{coin.symbol}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold">{coin.price}</td>
                  <td className="px-6 py-4">
                    <span className={coin.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                      {coin.change}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{coin.cap}</td>
                  <td className="px-6 py-4">
                    <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                      Track
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
