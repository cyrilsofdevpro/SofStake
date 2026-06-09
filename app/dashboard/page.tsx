'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, StoredUser } from '@/lib/user';
import {
  Bell,
  Gamepad2,
  Home,
  Sparkles,
  Trophy,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

const categories = [
  { name: 'Sports', icon: '⚽' },
  { name: 'Casino', icon: '🎰' },
  { name: 'Crash', icon: '🚀' },
  { name: 'Tournaments', icon: '🏆' },
];

const topCoins = [
  { name: 'SOFCOIN', symbol: 'SOF', price: '$0.018', change: '+24.5%' },
  { name: 'Bitcoin', symbol: 'BTC', price: '$67,890.12', change: '+2.35%' },
  { name: 'Ethereum', symbol: 'ETH', price: '$3,245.67', change: '+1.85%' },
];

const marketTabs = ['Hot', 'Gainers', 'New', 'Meme'];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [sofBalance, setSofBalance] = useState<number | null>(null);
  const [stakes, setStakes] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('Hot');

  const activeStakes = stakes.filter((stake) => stake.status === 'active');
  const totalStaked = activeStakes.reduce((sum, stake) => sum + (stake.amount || 0), 0);
  const lastBonusClaim = user?.lastBonusClaim ? new Date(user.lastBonusClaim) : null;
  const claimStatus = lastBonusClaim
    ? Date.now() - lastBonusClaim.getTime() >= 24 * 60 * 60 * 1000
      ? 'Ready to claim'
      : 'Claim cooldown active'
    : 'No mining claim yet';

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/auth');
      return;
    }
    setUser(storedUser);
    void loadDashboardData(storedUser.id);
  }, [router]);

  async function loadDashboardData(userId: string) {
    setLoadingStats(true);

    try {
      const walletRes = await fetch(`/api/wallet?userId=${encodeURIComponent(userId)}`);
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setSofBalance(walletData.sofBalance ?? 0);
      }
    } catch (error) {
      console.error('Failed to load wallet data', error);
    }

    try {
      const stakesRes = await fetch(`/api/staking?userId=${encodeURIComponent(userId)}`);
      if (stakesRes.ok) {
        const stakeData = await stakesRes.json();
        setStakes(Array.isArray(stakeData) ? stakeData : []);
      }
    } catch (error) {
      console.error('Failed to load staking data', error);
    }

    setLoadingStats(false);
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-xl px-5 pb-24">
        <div className="flex items-center justify-between gap-3 py-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-800 to-purple-700 text-base font-black text-white shadow-lg shadow-purple-900/30">
              SF
            </div>
            <div className="hidden gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-300 md:flex">
              <button className="rounded-full bg-cyan-500/15 px-3 py-2 text-cyan-300">Home</button>
              <button className="rounded-full px-3 py-2 text-slate-300 hover:text-white">Sports</button>
              <button className="rounded-full px-3 py-2 text-slate-300 hover:text-white">Casino</button>
            </div>
          </div>
          <button className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900/90 text-slate-300 transition hover:text-white">
            <Bell size={20} />
          </button>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-300">
                <Sparkles size={16} /> Trending
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Wallet Balance</p>
                <p className="mt-2 text-4xl font-black">₦{user.walletBalance?.toLocaleString() ?? 0}</p>
              </div>
              <p className="text-slate-300 leading-7">
                Bet. Play. Mine. Win everyday with live games and crypto rewards all in one dashboard.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-right">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">USDT Wallet</p>
              <p className="mt-2 text-3xl font-black text-cyan-300">2,450.50</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-purple-900/20 transition hover:from-purple-700 hover:to-fuchsia-600"
            >
              Play Now
            </Link>
            <Link
              href="/wallet"
              className="inline-flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Deposit
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <div key={category.name} className="rounded-3xl border border-white/10 bg-slate-900/90 p-4 text-center shadow-lg shadow-black/20 transition hover:border-cyan-500/30 hover:bg-slate-900/95">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl">{category.icon}</div>
              <p className="mt-3 text-sm font-semibold text-white">{category.name}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[2rem] border border-white/10 bg-slate-900/95 p-5 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">SOFCOIN MINING</p>
              <p className="mt-3 text-2xl font-black">560.25 SOF</p>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-purple-600 to-fuchsia-500 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white">
              Mining
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Your Mining Earnings</p>
              <p className="mt-3 text-xl font-semibold text-white">560.25 SOF</p>
            </div>
            <div className="rounded-3xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Mining Power</p>
              <p className="mt-3 text-xl font-semibold text-white">125.50 MH/s</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[2rem] border border-white/10 bg-slate-900/95 p-5 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Top Coins</p>
              <h2 className="mt-2 text-2xl font-bold">Market Watch</h2>
            </div>
            <button className="rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-200 transition hover:bg-white/10">
              View All
            </button>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {marketTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedTab === tab ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {topCoins.map((coin) => (
              <div key={coin.symbol} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-inner shadow-black/20">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900 text-xl">{coin.symbol.charAt(0)}</div>
                    <div>
                      <p className="font-semibold text-white">{coin.name}</p>
                      <p className="text-sm text-slate-400">{coin.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{coin.price}</p>
                    <p className="text-sm font-semibold text-emerald-400">{coin.change}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl py-3">
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 text-slate-300">
          <button className="flex flex-col items-center gap-1 text-cyan-400">
            <Home size={20} />
            <span className="text-[11px]">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <Gamepad2 size={20} />
            <span className="text-[11px]">Games</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <TrendingUp size={20} />
            <span className="text-[11px]">Bet</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <Wallet size={20} />
            <span className="text-[11px]">Wallet</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <Users size={20} />
            <span className="text-[11px]">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
