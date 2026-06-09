'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredUser } from '@/lib/user';
import { useRouter } from 'next/navigation';
import {
  Play,
  Trophy,
  Coins,
  Home,
  Gamepad2,
  TrendingUp,
  Wallet as WalletIcon,
  User,
  ShieldCheck,
} from 'lucide-react';

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const walletBalance = user?.walletBalance ?? 560.25;

  const categories = [
    { label: 'Sports', icon: '⚽', color: 'from-indigo-500 to-cyan-400' },
    { label: 'Casino', icon: '🎲', color: 'from-fuchsia-500 to-pink-400' },
    { label: 'Crash', icon: '🚀', color: 'from-amber-500 to-orange-400' },
    { label: 'Tournaments', icon: '🏆', color: 'from-emerald-500 to-lime-400' },
  ];

  const topCoins = [
    { name: 'SOFCOIN', symbol: 'SOF', value: '$0.018', change: '+24.5%', color: 'text-yellow-300' },
    { name: 'Bitcoin', symbol: 'BTC', value: '$67,890.12', change: '+2.35%', color: 'text-emerald-400' },
    { name: 'Ethereum', symbol: 'ETH', value: '$3,245.67', change: '+1.85%', color: 'text-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),_transparent_35%),linear-gradient(180deg,#020617_0%,#090b17_100%)] text-white overflow-hidden">
      <div className="max-w-md mx-auto px-5 pb-28">
        <header className="pt-8 pb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-purple-400/80">SofStake</p>
            <h1 className="text-3xl font-black tracking-tight mt-2">Win Big Everyday</h1>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 shadow-[0_20px_120px_rgba(139,92,246,0.18)]">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Wallet Balance</p>
            <p className="mt-2 text-lg font-bold">₦{Number(walletBalance).toLocaleString()}</p>
          </div>
        </header>

        <main className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-2xl shadow-purple-900/20 backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-purple-200 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Trending
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Play. Bet. Mine.</p>
                <h2 className="mt-3 text-4xl font-black leading-tight">The mobile hub for crypto gaming.</h2>
              </div>

              <p className="text-sm text-slate-300 leading-6">
                Explore sports, casino games, crash rounds and tournaments from one sleek interface.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href={user ? '/dashboard' : '/auth'}
                  className="rounded-3xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-purple-700/30 transition hover:scale-[1.01]"
                >
                  Play Now
                </Link>
                <Link
                  href={user ? '/dashboard' : '/auth'}
                  className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-100 transition hover:bg-white/10"
                >
                  Join Tournament
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            {categories.map((item) => (
              <div key={item.label} className={`rounded-3xl p-4 border border-white/10 bg-gradient-to-br ${item.color} from-opacity-20 to-opacity-10 shadow-xl shadow-[0_20px_60px_rgba(15,23,42,0.4)]`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-2xl bg-white/10 p-3 text-xl">{item.icon}</div>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-200/80">Play</span>
                </div>
                <p className="mt-5 text-sm text-slate-200/90 font-semibold">{item.label}</p>
              </div>
            ))}
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-5 shadow-2xl shadow-violet-900/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-[0.3em]">SofCoin Mining</p>
                <h3 className="mt-3 text-3xl font-black">560.25 SOF</h3>
              </div>
              <div className="rounded-3xl bg-white/5 px-4 py-3 text-sm text-slate-200">125.50 MH/s</div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Daily Earnings</span>
                <span className="text-emerald-400 font-semibold">+18.7%</span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-300">
                <ShieldCheck size={16} /> Secure Rewards
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-5 shadow-2xl shadow-purple-900/15">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-[0.3em]">Top Coins</p>
                <h3 className="mt-2 text-2xl font-bold">Market Watch</h3>
              </div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Live</div>
            </div>

            <div className="mt-5 space-y-4">
              {topCoins.map((coin) => (
                <div key={coin.symbol} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <p className="text-sm font-semibold">{coin.name}</p>
                    <p className="text-xs text-slate-400">{coin.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{coin.value}</p>
                    <p className={`text-sm ${coin.color}`}>{coin.change}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between text-slate-300">
          <Link href="#" className="flex flex-col items-center gap-1 text-slate-100">
            <Home size={24} />
            <span className="text-[11px] uppercase tracking-[0.23em]">Home</span>
          </Link>
          <Link href="#" className="flex flex-col items-center gap-1">
            <Gamepad2 size={24} />
            <span className="text-[11px] uppercase tracking-[0.23em]">Games</span>
          </Link>
          <Link href="#" className="flex flex-col items-center gap-1">
            <TrendingUp size={24} />
            <span className="text-[11px] uppercase tracking-[0.23em]">Bet</span>
          </Link>
          <Link href="#" className="flex flex-col items-center gap-1">
            <WalletIcon size={24} />
            <span className="text-[11px] uppercase tracking-[0.23em]">Wallet</span>
          </Link>
          <Link href="#" className="flex flex-col items-center gap-1">
            <User size={24} />
            <span className="text-[11px] uppercase tracking-[0.23em]">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
