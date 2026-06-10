'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredUser } from '@/lib/user';

export default function GamesHubPage() {
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setWalletBalance(user.walletBalance);
    }
  }, []);

  const games = [
    {
      id: 'coinflip',
      name: 'Coin Flip',
      description: 'Choose heads or tails and win 2x your bet',
      emoji: '🪙',
      multiplier: '2x',
      href: '/games/coinflip',
      status: 'active',
      minBet: 10,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'crash',
      name: 'Crash Game',
      description: 'Cash out before the crash and multiply your bet',
      emoji: '🚀',
      multiplier: 'Variable',
      href: '/game?game=crash',
      status: 'active',
      minBet: 10,
      color: 'from-purple-500 to-blue-500'
    },
    {
      id: 'dice',
      name: 'Dice Battle',
      description: 'Roll higher than your opponent to win',
      emoji: '🎲',
      multiplier: '2x',
      href: '/game',
      status: 'active',
      minBet: 100,
      color: 'from-red-500 to-pink-500'
    },
    {
      id: 'wheel',
      name: 'Wheel Game',
      description: 'Spin the wheel and win big prizes',
      emoji: '🎡',
      multiplier: '2x',
      href: '/game',
      status: 'active',
      minBet: 100,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'slots',
      name: 'Slots',
      description: 'Spin weighted reels and hit casino-style paylines',
      emoji: '🎰',
      multiplier: 'Up to 25x',
      href: '/games/slots',
      status: 'active',
      minBet: 50,
      color: 'from-pink-500 to-amber-400'
    },
    {
      id: 'mines',
      name: 'Mines',
      description: 'Avoid the mines and win multipliers',
      emoji: '💣',
      multiplier: 'Up to 10x',
      href: '/games/mines',
      status: 'active',
      minBet: 50,
      color: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'plinko',
      name: 'Plinko',
      description: 'Drop the ball and watch it fall for prizes',
      emoji: '⚪',
      multiplier: 'Up to 5x',
      href: '#',
      status: 'coming',
      minBet: 50,
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const activeGames = games.filter(g => g.status === 'active');
  const comingGames = games.filter(g => g.status === 'coming');

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
            🎮 Game Hub
          </h1>
          <p className="text-xl text-slate-400 mb-6">
            Play exciting games and multiply your winnings
          </p>
          <div className="flex justify-center gap-4">
            <div className="rounded-full bg-white/10 px-6 py-3 backdrop-blur-xl border border-white/20">
              <span className="text-slate-400">Your Balance:</span>
              <span className="ml-2 font-bold text-yellow-400">₦{walletBalance.toLocaleString()}</span>
            </div>
            <Link
              href="/wallet"
              className="rounded-full bg-yellow-500 text-black px-6 py-3 font-semibold hover:bg-yellow-600 transition"
            >
              Deposit
            </Link>
          </div>
        </div>

        {/* Active Games */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
            <span>🔥 Active Games</span>
            <span className="text-sm bg-green-500/20 text-green-400 px-3 py-1 rounded-full">{activeGames.length} Available</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeGames.map((game) => (
              <Link
                key={game.id}
                href={game.href}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-8 backdrop-blur-xl transition hover:border-white/30 hover:shadow-2xl hover:shadow-purple-500/20"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${game.color} transition`}></div>

                {/* Content */}
                <div className="relative z-10 space-y-4">
                  <div className="text-6xl">{game.emoji}</div>
                  <h3 className="text-2xl font-bold text-white">{game.name}</h3>
                  <p className="text-sm text-slate-400">{game.description}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Multiplier</p>
                        <p className="font-bold text-yellow-400">{game.multiplier}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Min Bet</p>
                        <p className="font-bold text-slate-200">₦{game.minBet}</p>
                      </div>
                    </div>
                    <button className={`rounded-full bg-gradient-to-r ${game.color} px-4 py-2 text-sm font-semibold text-white group-hover:shadow-lg transition`}>
                      Play →
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Coming Soon Games */}
        {comingGames.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
              <span>🚀 Coming Soon</span>
              <span className="text-sm bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">{comingGames.length} Upcoming</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comingGames.map((game) => (
                <div
                  key={game.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-8 backdrop-blur-xl opacity-60"
                >
                  {/* Content */}
                  <div className="space-y-4">
                    <div className="text-6xl grayscale">{game.emoji}</div>
                    <h3 className="text-2xl font-bold text-white">{game.name}</h3>
                    <p className="text-sm text-slate-400">{game.description}</p>

                    {/* Coming Soon Badge */}
                    <div className="pt-4 border-t border-white/10">
                      <span className="inline-block rounded-full bg-blue-500/20 text-blue-400 px-4 py-2 text-sm font-semibold">
                        Coming Soon 🔒
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer Navigation */}
        <div className="mt-16 pt-8 border-t border-white/10 flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white hover:border-white/40 transition"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-full border border-yellow-500/50 bg-yellow-500/10 px-6 py-3 font-semibold text-yellow-400 hover:border-yellow-500 transition"
          >
            View Leaderboard
          </Link>
        </div>
      </div>
    </main>
  );
}
