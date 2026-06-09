'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/user';

export default function AnalyticsPage() {
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
        <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-slate-400">Deep insights into your gaming activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6">
          <h3 className="font-semibold text-lg mb-4">Performance Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-sm">Total Games Played</span>
              <span className="font-bold">0</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-sm">Total Winnings</span>
              <span className="font-bold">₦0</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-sm">Total Losses</span>
              <span className="font-bold">₦0</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-sm">Net Profit</span>
              <span className="font-bold text-green-400">₦0</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6">
          <h3 className="font-semibold text-lg mb-4">Time Analytics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-sm">Total Play Time</span>
              <span className="font-bold">0h</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-sm">Avg Session Length</span>
              <span className="font-bold">0m</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-sm">Peak Hours</span>
              <span className="font-bold">N/A</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-sm">Favorite Game</span>
              <span className="font-bold">N/A</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6">
        <h3 className="font-semibold text-lg mb-4">Charts Coming Soon</h3>
        <p className="text-slate-400">Advanced analytics charts and graphs will be available once you start playing games.</p>
      </div>
    </div>
  );
}
