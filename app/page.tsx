'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredUser } from '@/lib/user';
import { Play, Trophy, Coins, ShieldCheck, Sparkles, TrendingUp, Shield, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const stats = [
    { label: 'Active Players', value: '250K+' },
    { label: 'Games Available', value: '150+' },
    { label: 'Tournaments', value: '10K+' },
    { label: 'Daily Rewards', value: '5.2M+' },
  ];

  const features = [
    {
      title: 'Live Sports Betting',
      description: 'Place fast, secure bets across multiple sports and events.',
      icon: '⚽',
    },
    {
      title: 'Casino Classics',
      description: 'Enjoy roulette, slots, blackjack, and live dealer action.',
      icon: '🎰',
    },
    {
      title: 'Instant Mining',
      description: 'Earn SofCoin rewards while you play and stake daily.',
      icon: '⛏️',
    },
    {
      title: 'Tournament Leaderboards',
      description: 'Climb the ranks and win exclusive prize pools.',
      icon: '🏆',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-500 text-xl font-black text-white shadow-lg shadow-purple-800/30">
              S
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight">SofStake</p>
              <p className="text-xs uppercase tracking-[0.35em] text-purple-300">Play. Bet. Mine.</p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm uppercase tracking-[0.35em] text-slate-300 transition hover:text-white">
              Features
            </Link>
            <Link href="#stats" className="text-sm uppercase tracking-[0.35em] text-slate-300 transition hover:text-white">
              Stats
            </Link>
            <Link href="#cta" className="text-sm uppercase tracking-[0.35em] text-slate-300 transition hover:text-white">
              Join
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:border-purple-400 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/auth"
                  className="rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-800/20 transition hover:from-purple-700 hover:to-fuchsia-600"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-20">
        <section className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-purple-300 shadow-sm shadow-purple-500/10">
              <Sparkles size={16} /> New launch: SofStake 2.0
            </div>

            <div className="space-y-6">
              <h1 className="max-w-3xl text-5xl font-black leading-tight text-white md:text-6xl">
                Play the next wave of gaming, betting, and crypto rewards.
              </h1>
              <p className="max-w-xl text-lg text-slate-300 leading-8">
                SofStake combines live sports, casino favorites, crash games and a reward-driven mining hub for one seamless experience.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href={user ? '/dashboard' : '/auth'}
                className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-purple-800/20 transition hover:scale-[1.01]"
              >
                <Play size={20} className="mr-3" /> Start Playing
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Explore Features
                <ChevronRight size={18} className="ml-2" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
                  <p className="text-3xl font-black text-purple-300">{item.value}</p>
                  <p className="mt-2 text-sm uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 to-purple-950/75 p-10 shadow-2xl shadow-purple-900/25">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(192,132,252,0.18),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.15),_transparent_25%)]" />
            <div className="relative space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Live odds</p>
                    <p className="mt-2 text-2xl font-black">3.5x</p>
                  </div>
                  <div className="rounded-3xl bg-purple-700/20 px-3 py-2 text-sm text-purple-100">Sports</div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Wallet</p>
                    <p className="mt-2 text-3xl font-black text-white">₦560.25</p>
                  </div>
                  <div className="rounded-3xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">+18.7%</div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Tournaments</p>
                  <p className="mt-3 text-2xl font-black">120+</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Mining Rate</p>
                  <p className="mt-3 text-2xl font-black">125.5 MH/s</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-20 space-y-8">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Why choose SofStake</p>
            <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Everything you need to win and earn in one platform.</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-[1.75rem] border border-white/10 bg-slate-900/90 p-7 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-purple-500/40">
                <div className="text-4xl">{feature.icon}</div>
                <h3 className="mt-5 text-xl font-bold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="cta" className="mt-20 rounded-[2rem] border border-white/10 bg-gradient-to-r from-purple-950/90 via-slate-900/80 to-fuchsia-950/90 p-10 shadow-2xl shadow-purple-950/30">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Ready to join the winner’s circle?</p>
              <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">Get started with SofStake and level up your play.</h2>
            </div>
            <Link
              href={user ? '/dashboard' : '/auth'}
              className="inline-flex items-center justify-center rounded-3xl bg-white px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              {user ? 'Go to Dashboard' : 'Create Account'}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
