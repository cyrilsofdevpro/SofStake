'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredUser } from '@/lib/user';
import { useRouter } from 'next/navigation';
import { Play, Trophy, Coins } from 'lucide-react';

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 text-white overflow-hidden">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-purple-500/20 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-purple-400">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <p className="text-xl font-bold">SofStake</p>
              <p className="text-xs text-purple-400">PLAY. BET. MINE. WIN.</p>
            </div>
          </Link>

          {/* Center Nav Items */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#play" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition uppercase text-sm font-semibold tracking-wide">
              <Play size={16} /> PLAY
            </a>
            <a href="#bet" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition uppercase text-sm font-semibold tracking-wide">
              🎰 BET
            </a>
            <a href="#mine" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition uppercase text-sm font-semibold tracking-wide">
              ⛏️ MINE
            </a>
            <a href="#earn" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition uppercase text-sm font-semibold tracking-wide">
              <Coins size={16} /> EARN
            </a>
            <a href="#win" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition uppercase text-sm font-semibold tracking-wide">
              👑 WIN
            </a>
          </div>

          {/* Right Side - Auth Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="px-6 py-2 border border-purple-500/50 hover:border-purple-400 text-purple-300 hover:text-purple-200 rounded-lg font-semibold transition-colors"
                >
                  LOGIN
                </Link>
                <Link
                  href="/auth"
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg font-semibold transition-all shadow-lg shadow-purple-600/50"
                >
                  SIGN UP
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-black leading-tight">
                <span className="text-white">PLAY.</span>
                <br />
                <span className="text-white">BET.</span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-transparent">MINE. WIN.</span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-300 font-medium">
                The Future of <span className="text-yellow-400">Gaming</span>, <span className="text-purple-400">Betting</span> & <span className="text-purple-300">Crypto</span>
              </p>

              <p className="text-lg text-slate-400 max-w-md leading-relaxed">
                Join thousands of players earning SofCoin daily. Play games, bet on sports, mine rewards and win big!
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link
                href={user ? '/dashboard' : '/auth'}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg font-bold uppercase tracking-wider transition-all shadow-2xl shadow-purple-600/50 flex items-center justify-center gap-2 group"
              >
                <Play size={20} className="group-hover:scale-110 transition-transform" /> PLAY NOW
              </Link>
              <Link
                href={user ? '/dashboard' : '/auth'}
                className="px-8 py-4 border-2 border-purple-500/50 hover:border-purple-400 text-white hover:bg-purple-500/10 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <Trophy size={20} /> JOIN TOURNAMENT
              </Link>
            </div>
          </div>

          {/* Right Visual - Gaming Character with Effects */}
          <div className="relative h-80 md:h-full min-h-96 flex items-center justify-center">
            {/* Animated Background Effects */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Large glowing circles */}
              <div className="absolute w-80 h-80 bg-gradient-radial from-purple-600/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>
              
              {/* Coins floating animation */}
              <div className="absolute top-8 right-16 text-6xl animate-bounce" style={{ animationDelay: '0s' }}>
                💰
              </div>
              <div className="absolute bottom-16 left-8 text-5xl animate-bounce" style={{ animationDelay: '0.5s' }}>
                💰
              </div>
              <div className="absolute top-32 left-16 text-4xl animate-bounce" style={{ animationDelay: '1s' }}>
                💰
              </div>

              {/* Upward arrow */}
              <div className="absolute top-12 right-12 text-5xl animate-pulse">
                📈
              </div>

              {/* Soccer ball */}
              <div className="absolute bottom-20 right-12 text-6xl animate-bounce" style={{ animationDelay: '0.7s' }}>
                ⚽
              </div>

              {/* Main Character - Cyborg */}
              <div className="relative z-10 text-center">
                <div className="text-9xl mb-4 filter drop-shadow-2xl animate-pulse" style={{
                  textShadow: '0 0 80px rgba(168, 85, 247, 0.9), 0 0 40px rgba(236, 72, 153, 0.8), 0 0 20px rgba(236, 72, 153, 0.6)'
                }}>
                  🤖
                </div>
                <div className="text-7xl animate-bounce" style={{
                  textShadow: '0 0 60px rgba(236, 72, 153, 0.95), 0 0 30px rgba(168, 85, 247, 0.8)',
                  animationDelay: '0.3s'
                }}>
                  S
                </div>
              </div>

              {/* Decorative rotating circles */}
              <div className="absolute top-1/4 right-1/4 w-40 h-40 border border-purple-500/30 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
              <div className="absolute bottom-1/4 left-1/4 w-56 h-56 border border-purple-500/20 rounded-full animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-purple-500/20 bg-slate-950/50 backdrop-blur-sm py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">👥</span>
              <p className="text-3xl md:text-4xl font-bold text-purple-400">250K+</p>
            </div>
            <p className="text-slate-400 text-sm md:text-base">Active Players</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🎮</span>
              <p className="text-3xl md:text-4xl font-bold text-purple-400">150+</p>
            </div>
            <p className="text-slate-400 text-sm md:text-base">Games</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🏆</span>
              <p className="text-3xl md:text-4xl font-bold text-purple-400">10K+</p>
            </div>
            <p className="text-slate-400 text-sm md:text-base">Tournaments</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">S</span>
              <p className="text-3xl md:text-4xl font-bold text-yellow-400">5.2M+</p>
            </div>
            <p className="text-slate-400 text-sm md:text-base">SofCoin Earned</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🛡️</span>
              <p className="text-3xl md:text-4xl font-bold text-green-400">100%</p>
            </div>
            <p className="text-slate-400 text-sm md:text-base">Secure & Fair</p>
          </div>
        </div>
      </section>

      {/* Features Preview Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Why Choose <span className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">SofStake</span>?
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: '🎮',
                title: 'Play & Earn',
                desc: 'Earn SofCoin while playing your favorite games'
              },
              {
                icon: '⛏️',
                title: 'Mining Rewards',
                desc: 'Mine daily rewards through gameplay and activities'
              },
              {
                icon: '💎',
                title: 'Crypto Ready',
                desc: 'Future blockchain integration with real crypto'
              },
              {
                icon: '🏆',
                title: 'Tournaments',
                desc: 'Compete for huge prize pools and glory'
              }
            ].map((feature, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/30 hover:border-purple-500/60 transition-colors group">
                <p className="text-4xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</p>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-6 bg-gradient-to-t from-purple-950/20 to-transparent">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h3 className="text-3xl md:text-4xl font-bold">Ready to Start Playing?</h3>
          <p className="text-xl text-slate-400">Join thousands of players and start earning SofCoin today!</p>
          <Link
            href={user ? '/dashboard' : '/auth'}
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg font-bold uppercase tracking-wider transition-all shadow-2xl shadow-purple-600/50"
          >
            {user ? 'Go to Dashboard' : 'Sign Up Now'}
          </Link>
        </div>
      </section>
    </div>
  );
}
