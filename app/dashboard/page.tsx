'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, StoredUser } from '@/lib/user';
import { TrendingUp, Trophy, Users, Target, Zap, TrendingDown } from 'lucide-react';
import img1 from '@/components/betting image/img1.jpg';
import img2 from '@/components/betting image/img2.jpg';
import img3 from '@/components/betting image/img3.jpg';
import img4 from '@/components/betting image/img4.jpg';
import img5 from '@/components/betting image/img5.jpg';

const bettingImages = [
  { src: img1, label: 'Sports Betting' },
  { src: img2, label: 'Live Casino' },
  { src: img3, label: 'Crash Games' },
  { src: img4, label: 'Tournaments' },
  { src: img5, label: 'Rewards' }
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [sofBalance, setSofBalance] = useState<number | null>(null);
  const [usdBalance, setUsdBalance] = useState<number | null>(null);
  const [stakes, setStakes] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

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
        setUsdBalance(walletData.usdBalance ?? 0);
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20">
        <Image
          src={img1}
          alt="Bet Play Win"
          width={1600}
          height={900}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="relative z-10 p-8 sm:p-10 lg:p-12">
          <div className="mb-6 max-w-3xl">
            <p className="text-sm uppercase tracking-widest text-cyan-400">Bet Play Win</p>
            <h1 className="text-4xl sm:text-5xl font-bold mt-2">Win Big Everyday</h1>
            <p className="text-slate-300 mt-3 max-w-2xl text-sm sm:text-base">
              Stake NGN, match with other players, or fall back to a smart bot if no challenger shows up. Multiple game modes, tournaments, and crypto rewards await!
            </p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all text-sm sm:text-base">
            Play Now
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-slate-400">Wallet Balance</p>
              <p className="text-2xl font-bold mt-2">₦{user?.walletBalance?.toLocaleString() ?? 0}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              💰
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6 hover:border-purple-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-slate-400">SofCoin Balance</p>
              <p className="text-2xl font-bold mt-2">{sofBalance !== null ? sofBalance.toLocaleString() : '—'}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              ⛏️
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6 hover:border-pink-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-slate-400">Active Stakes</p>
              <p className="text-2xl font-bold mt-2">{activeStakes.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
              📊
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/50 border border-white/5 p-6 hover:border-blue-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-slate-400">Mining Streak</p>
              <p className="text-2xl font-bold mt-2">{user?.loginStreak || 0}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              🔥
            </div>
          </div>
        </div>
      </div>

      {/* Games Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Game Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Sports Betting', icon: '🏈', color: 'from-blue-500' },
            { name: 'Casino', icon: '🎰', color: 'from-purple-500' },
            { name: 'Crash Games', icon: '📈', color: 'from-pink-500' },
            { name: 'Tournaments', icon: '🏆', color: 'from-yellow-500' }
          ].map((game) => (
            <div
              key={game.name}
              className={`rounded-xl bg-gradient-to-br ${game.color}/10 border border-white/10 p-6 cursor-pointer hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/20`}
            >
              <div className="text-4xl mb-3">{game.icon}</div>
              <p className="font-semibold">{game.name}</p>
              <p className="text-sm text-slate-400 mt-2">Click to explore</p>
            </div>
          ))}
        </div>
      </div>

      {/* Betting Images Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Featured Betting</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {bettingImages.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
            >
              <Image
                src={item.src}
                alt={item.label}
                width={400}
                height={240}
                sizes="(max-width: 768px) 100vw, 20vw"
                className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-4">
                <p className="text-sm font-semibold text-white">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crypto Market Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Crypto Market</h2>
          <a href="#" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">View All →</a>
        </div>
        <div className="rounded-xl bg-slate-900/50 border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-slate-800/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Coin</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">24h</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Bitcoin', symbol: 'BTC', price: '$43,200', change: '+2.5%', cap: '$845B' },
                  { name: 'Ethereum', symbol: 'ETH', price: '$2,300', change: '+1.8%', cap: '$276B' },
                  { name: 'Solana', symbol: 'SOL', price: '$98.25', change: '+5.2%', cap: '$42.5B' },
                  { name: 'Dogecoin', symbol: 'DOGE', price: '$0.08', change: '+3.1%', cap: '$12.3B' }
                ].map((coin) => (
                  <tr key={coin.symbol} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold">
                          {coin.symbol.charAt(0)}
                        </span>
                        <div>
                          <p className="font-semibold text-sm">{coin.name}</p>
                          <p className="text-xs text-slate-400">{coin.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">{coin.price}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-green-400 font-semibold">{coin.change}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{coin.cap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tournaments Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Active Tournaments</h2>
          <div className="space-y-4">
            {[
              { name: 'Weekend Mega Tournament', prize: '₦1,000,000', participants: 2500, status: 'Live' },
              { name: 'SofCoin Mining Challenge', prize: '5000 SofCoins', participants: 1800, status: 'Upcoming' },
              { name: 'Crypto Betting Series', prize: '0.5 BTC', participants: 800, status: 'Live' }
            ].map((tournament) => (
              <div key={tournament.name} className="rounded-xl bg-slate-900/50 border border-white/5 p-6 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{tournament.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      <span className="flex items-center gap-1"><Trophy size={16} /> Prize: {tournament.prize}</span>
                      <span className="flex items-center gap-1"><Users size={16} /> {tournament.participants} players</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      tournament.status === 'Live' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {tournament.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mining & Rewards */}
        <div>
          <h2 className="text-2xl font-bold mb-6">SofStake Mining</h2>
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-6">
              <div className="text-center">
                <p className="text-sm uppercase text-slate-400 mb-2">Mining claim status</p>
                <p className="text-3xl font-bold text-purple-400">{claimStatus}</p>
                <p className="text-xs text-slate-400 mt-1">Last claim: {lastBonusClaim ? lastBonusClaim.toLocaleDateString() : 'none'}</p>
              </div>
              <div className="mt-6 pt-6 border-t border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Weekly cap</span>
                  <span className="font-semibold">20 SofCoins</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Recent streak</span>
                  <span className="font-semibold text-yellow-400">{user?.loginStreak || 0} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Reward momentum</span>
                  <span className="font-semibold text-green-400">+2 to +20 SofCoins</span>
                </div>
              </div>
              <Link href="/mining-hub" className="block w-full mt-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all text-sm text-center text-white">
                Open Mining Hub
              </Link>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/80 p-6">
              <h3 className="text-lg font-semibold mb-4">Staking overview</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4 text-sm">
                  <p className="text-slate-400">Total staked</p>
                  <p className="mt-2 text-xl font-semibold">{totalStaked.toLocaleString()} SofCoin</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4 text-sm">
                  <p className="text-slate-400">Active stakes</p>
                  <p className="mt-2 text-xl font-semibold">{activeStakes.length}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-300">Your current active stakes are shown here and updated automatically from your staking activity.</p>
              <Link href="/staking" className="inline-flex items-center justify-center mt-5 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                Manage Staking
              </Link>
            </div>

            {/* Quick Links */}
            <div className="rounded-xl bg-slate-900/50 border border-white/5 p-4 space-y-2">
              <Link href="/referrals" className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
                → Invite Friends
              </Link>
              <Link href="/buy-sofcoin" className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
                → Buy SofCoin
              </Link>
              <Link href="/wallet" className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
                → Deposit Funds
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
