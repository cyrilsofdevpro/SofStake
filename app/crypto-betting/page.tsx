'use client';

import React from 'react';
import Link from 'next/link';

export default function CryptoBettingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-purple-500/20 bg-slate-900/80 p-10 text-center shadow-2xl shadow-purple-500/10 backdrop-blur-md">
        <div className="mb-6 inline-flex rounded-full bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">
          🚧 Coming Soon
        </div>
        <h1 className="text-5xl font-bold text-white sm:text-6xl">Crypto Betting Arena</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
          The crypto betting experience is being polished right now. For the best live action,
          focus on the game betting arena and stay tuned for this feature soon.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/game"
            className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
          >
            Go to Game Betting
          </Link>
          <Link
            href="/dashboard"
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:border-purple-400/40"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white/5 p-5 text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Why hold</p>
            <p className="mt-3 text-sm text-slate-300">We’re pausing crypto betting so we can focus on game betting stability first.</p>
          </div>
          <div className="rounded-3xl bg-white/5 p-5 text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Live games</p>
            <p className="mt-3 text-sm text-slate-300">Dice, wheel, crash and more are already available in the game arena.</p>
          </div>
          <div className="rounded-3xl bg-white/5 p-5 text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Stay tuned</p>
            <p className="mt-3 text-sm text-slate-300">Crypto betting will return once the feature is production-ready.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

