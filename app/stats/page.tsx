'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/user';

export default function StatsPage() {
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
        <h1 className="text-4xl font-bold mb-2">Your Statistics</h1>
        <p className="text-slate-400">Track your gaming performance and progress</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6">
          <p className="text-sm uppercase text-slate-400">Total Wins</p>
          <p className="text-3xl font-bold mt-2">{user?.totalWins || 0}</p>
        </div>
        <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6">
          <p className="text-sm uppercase text-slate-400">Win Rate</p>
          <p className="text-3xl font-bold mt-2">0%</p>
        </div>
        <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6">
          <p className="text-sm uppercase text-slate-400">Total XP</p>
          <p className="text-3xl font-bold mt-2">{user?.xp || 0}</p>
        </div>
        <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6">
          <p className="text-sm uppercase text-slate-400">Avg Streak</p>
          <p className="text-3xl font-bold mt-2">{user?.winStreak || 0}</p>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6">
        <h3 className="font-semibold text-lg mb-4">Game Performance</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span>Dice Battle</span>
            <span className="text-slate-400">0 wins</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span>Wheel Duel</span>
            <span className="text-slate-400">0 wins</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span>Aviator</span>
            <span className="text-slate-400">0 wins</span>
          </div>
        </div>
      </div>
    </div>
  );
}
