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

const marketAlerts = [
  { title: 'New Meme Coin $PEPEKING', subtitle: 'Launched 2m ago', status: 'Live' },
  { title: 'Bitcoin Price Increased', subtitle: 'BTC is up by 2.35%', status: 'Alert' },
  { title: 'SofCoin Price Increased', subtitle: 'SOF is up by 24.5%', status: 'Trending' },
];

const topPlayers = [
  { name: 'CryptoKing', score: '12,450 SOF' },
  { name: 'BetMaster', score: '9,860 SOF' },
  { name: 'CoinHunter', score: '7,540 SOF' },
];

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
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.9fr_1fr]">
          <main className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 p-4 sm:p-6 shadow-2xl shadow-black/30">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3 min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-300">
                    <Sparkles size={16} /> Trending
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-slate-400">Wallet Balance</p>
                    <p className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black break-words">₦{user.walletBalance?.toLocaleString() ?? 0}</p>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-6">
                    Bet. Play. Mine. Win everyday with live games, crypto rewards, and the fastest social betting experience.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 w-full sm:grid-cols-2 lg:w-auto">
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">SOF Balance</p>
                    <p className="mt-3 text-2xl sm:text-3xl font-black text-cyan-300">{(sofBalance ?? 0).toFixed(2)} SOF</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Mining Status</p>
                    <p className="mt-3 text-xs sm:text-sm font-semibold text-amber-300 break-words">{claimStatus}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-wrap gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-xl shadow-purple-900/20 transition hover:from-purple-700 hover:to-fuchsia-600"
                >
                  Play Now
                </Link>
                <Link
                  href="/wallet"
                  className="inline-flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Deposit
                </Link>
                <Link
                  href="/buy-sofcoin"
                  className="inline-flex items-center justify-center rounded-3xl border border-white/10 bg-cyan-600/10 px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-cyan-200 transition hover:bg-cyan-600/20"
                >
                  Buy SofCoin
                </Link>
                <Link
                  href="/mining-hub"
                  className="inline-flex items-center justify-center rounded-3xl border border-white/10 bg-emerald-600/10 px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-emerald-200 transition hover:bg-emerald-600/20"
                >
                  Claim SofCoin
                </Link>
              </div>
            </section>

            <section className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[2rem] border border-white/10 bg-slate-900/95 p-4 sm:p-5 shadow-2xl shadow-black/30 overflow-hidden">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-slate-400">SOFCOIN</p>
                      <p className="mt-2 text-2xl sm:text-3xl font-black break-words">{(sofBalance ?? 0).toFixed(2)} SOF</p>
                      <p className="text-xs text-slate-400 mt-1">Mining Earnings</p>
                    </div>
                    <div className="rounded-full bg-yellow-400/10 p-2 sm:p-3 text-yellow-300 text-2xl sm:text-3xl drop-shadow-lg flex-shrink-0">🪙</div>
                  </div>
                </div>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-slate-900/95 p-4 sm:p-5 shadow-2xl shadow-black/30 overflow-hidden">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-slate-400">Total Staked</p>
                    <p className="mt-2 text-2xl sm:text-3xl font-black break-words">{totalStaked.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-xs text-slate-300">Status</p>
                    <p className="mt-1 text-xs sm:text-sm font-semibold text-white break-words">{claimStatus}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-900/95 p-5 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Top Coins</p>
                  <h2 className="mt-2 text-2xl font-bold">Market Watch</h2>
                </div>
                <button className="rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-200 transition hover:bg-white/10">
                  View All
                </button>
              </div>
              <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
                {marketTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      selectedTab === tab ? 'bg-purple-700 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                {topCoins.map((coin) => (
                  <div key={coin.symbol} className="flex items-center justify-between rounded-3xl bg-slate-950/80 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold">{coin.symbol.charAt(0)}</div>
                      <div>
                        <p className="font-semibold text-white">{coin.name}</p>
                        <p className="text-xs text-slate-400">{coin.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{coin.price}</p>
                      <p className="text-sm text-emerald-400">{coin.change}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="hidden xl:block space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/95 p-5 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Quick Stats</p>
                  <h2 className="mt-2 text-2xl font-bold">Activity</h2>
                </div>
                <div className="rounded-full bg-cyan-500/10 p-3 text-cyan-300">
                  <Zap size={20} />
                </div>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Current Users</p>
                  <p className="mt-2 text-xl font-semibold text-white">{topPlayers.length * 1320}</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Claim Status</p>
                  <p className="mt-2 text-xl font-semibold text-white">{claimStatus}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/95 p-5 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Market Alerts</p>
                  <h2 className="mt-2 text-2xl font-bold">Live Feed</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {marketAlerts.map((alert) => (
                  <div key={alert.title} className="rounded-3xl bg-slate-950/80 p-4">
                    <p className="text-sm font-semibold text-white">{alert.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{alert.subtitle}</p>
                    <span className="mt-3 inline-flex rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                      {alert.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/95 p-5 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Top Players</p>
                  <h2 className="mt-2 text-2xl font-bold">Leaderboards</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {topPlayers.map((player) => (
                  <div key={player.name} className="flex items-center justify-between rounded-3xl bg-slate-950/80 p-4">
                    <div>
                      <p className="font-semibold text-white">{player.name}</p>
                      <p className="text-xs text-slate-400">Top trader</p>
                    </div>
                    <p className="text-sm font-semibold text-cyan-300">{player.score}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="md:hidden fixed inset-x-0 bottom-0 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl py-3">
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
