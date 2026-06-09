'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, LeaderboardEntry, getTopPlayersByXp, getTopPlayersByWinRate, getTopPlayersByWins, getTopPlayersByStreak } from '@/lib/user';

type TimeFilter = 'all' | 'weekly' | 'monthly';
type LeaderboardType = 'xp' | 'winRate' | 'wins' | 'streak';

export default function LeaderboardPage() {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('xp');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    loadLeaderboard();
  }, [leaderboardType, timeFilter, router]);

  const loadLeaderboard = () => {
    let data: LeaderboardEntry[] = [];
    switch (leaderboardType) {
      case 'xp':
        data = getTopPlayersByXp(50); // Get more to filter
        break;
      case 'winRate':
        data = getTopPlayersByWinRate(50);
        break;
      case 'wins':
        data = getTopPlayersByWins(50);
        break;
      case 'streak':
        data = getTopPlayersByStreak(50);
        break;
    }

    // Filter by time
    const now = new Date();
    const filtered = data.filter(entry => {
      const lastActive = new Date(entry.lastActive);
      switch (timeFilter) {
        case 'weekly':
          return (now.getTime() - lastActive.getTime()) <= (7 * 24 * 60 * 60 * 1000);
        case 'monthly':
          return (now.getTime() - lastActive.getTime()) <= (30 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    });

    setEntries(filtered.slice(0, 10)); // Top 10 after filtering
  };

  const getTitle = () => {
    const timeLabel = timeFilter === 'all' ? 'All Time' : timeFilter === 'weekly' ? 'Weekly' : 'Monthly';
    const typeLabel = (() => {
      switch (leaderboardType) {
        case 'xp':
          return 'XP Ranking';
        case 'winRate':
          return 'Win Rate Ranking';
        case 'wins':
          return 'Total Wins Ranking';
        case 'streak':
          return 'Win Streak Ranking';
      }
    })();
    return `${timeLabel} ${typeLabel}`;
  };

  const getValue = (entry: LeaderboardEntry) => {
    switch (leaderboardType) {
      case 'xp':
        return entry.xp;
      case 'winRate':
        return `${(entry.winRate * 100).toFixed(1)}%`;
      case 'wins':
        return entry.totalWins;
      case 'streak':
        return entry.winStreak;
    }
  };

  return (
    <main className="min-h-screen bg-background text-white pb-20 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 md:py-16">
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-accent">Leaderboard</p>
            <h1 className="mt-2 sm:mt-3 text-2xl sm:text-3xl md:text-4xl font-semibold">Top players</h1>
            <p className="mt-1 sm:mt-2 max-w-2xl text-xs sm:text-sm md:text-base text-slate-300">
              Compete with players worldwide. Rankings update in real-time.
            </p>
          </div>
        </div>

        <div className="mb-4 sm:mb-6 md:mb-8 flex flex-wrap gap-2 sm:gap-3">
          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              className={`rounded-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition min-h-[44px] ${timeFilter === 'all' ? 'bg-accent text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('monthly')}
              className={`rounded-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition min-h-[44px] ${timeFilter === 'monthly' ? 'bg-accent text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('weekly')}
              className={`rounded-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition min-h-[44px] ${timeFilter === 'weekly' ? 'bg-accent text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
            >
              Weekly
            </button>
          </div>
        </div>

        <div className="mb-4 sm:mb-6 md:mb-8 flex flex-wrap gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setLeaderboardType('xp')}
            className={`rounded-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition min-h-[44px] ${leaderboardType === 'xp' ? 'bg-accent text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
          >
            XP Ranking
          </button>
          <button
            type="button"
            onClick={() => setLeaderboardType('winRate')}
            className={`rounded-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition min-h-[44px] ${leaderboardType === 'winRate' ? 'bg-accent text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
          >
            Win Rate
          </button>
          <button
            type="button"
            onClick={() => setLeaderboardType('wins')}
            className={`rounded-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition min-h-[44px] ${leaderboardType === 'wins' ? 'bg-accent text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
          >
            Total Wins
          </button>
          <button
            type="button"
            onClick={() => setLeaderboardType('streak')}
            className={`rounded-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition min-h-[44px] ${leaderboardType === 'streak' ? 'bg-accent text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
          >
            Win Streak
          </button>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-surface/80 p-4 sm:p-6 md:p-8 shadow-glow backdrop-blur-xl">
          <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl md:text-2xl font-semibold">{getTitle()}</h2>
          {entries.length === 0 ? (
            <p className="text-xs sm:text-sm md:text-base text-slate-400">No players yet. Be the first to rank!</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {entries.map((entry, index) => (
                <div key={entry.id} className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/80 p-3 sm:p-4 md:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-accent text-xs sm:text-sm text-slate-950 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-white">{entry.username}</p>
                      <p className="text-xs sm:text-sm text-slate-400">Level {entry.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg md:text-xl font-semibold text-white">{getValue(entry)}</p>
                    <p className="text-xs sm:text-sm text-slate-400">
                      {leaderboardType === 'xp' && `${entry.totalWins} wins`}
                      {leaderboardType === 'winRate' && `${entry.totalWins} wins`}
                      {leaderboardType === 'wins' && `${entry.xp} XP`}
                      {leaderboardType === 'streak' && `${entry.xp} XP`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}