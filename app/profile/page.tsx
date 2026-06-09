'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, StoredUser } from '@/lib/user';

export default function ProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/auth');
      return;
    }

    setUser(storedUser);
  }, [router]);

  if (!user) {
    return null;
  }

  const joinedDate = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long'
  });

  const handleLogout = async () => {
    try {
      // Call logout API
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.removeItem('sofstake-session-user');
          window.localStorage.removeItem('sofstake-users');
        } catch (e) {
          // ignore
        }
      }
      
      // Redirect to auth page
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth');
    }
  };

  return (
    <main className="min-h-screen bg-background text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-[32px] border border-white/10 bg-surface/80 p-10 shadow-glow backdrop-blur-xl">
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
            <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-accent">Profile</p>
                  <h1 className="mt-4 text-4xl font-semibold">Player stats</h1>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-red-500 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                >
                  Logout
                </button>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-black/30 p-5">
                  <p className="text-sm uppercase text-slate-400">Username</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{user.username}</p>
                </div>
                <div className="rounded-3xl bg-black/30 p-5">
                  <p className="text-sm uppercase text-slate-400">Wallet</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-200">₦{user.walletBalance.toLocaleString()}</p>
                </div>
                <div className="rounded-3xl bg-black/30 p-5">
                  <p className="text-sm uppercase text-slate-400">Level</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{user.level}</p>
                </div>
                <div className="rounded-3xl bg-black/30 p-5">
                  <p className="text-sm uppercase text-slate-400">XP</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-200">{user.xp}</p>
                </div>
                <div className="rounded-3xl bg-black/30 p-5">
                  <p className="text-sm uppercase text-slate-400">Win Streak</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{user.winStreak}</p>
                </div>
                <div className="rounded-3xl bg-black/30 p-5">
                  <p className="text-sm uppercase text-slate-400">Total Wins</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-200">{user.totalWins}</p>
                </div>
              </div>
            </section>
            <aside className="rounded-3xl border border-white/10 bg-slate-950/80 p-8">
              <p className="text-sm uppercase tracking-[0.35em] text-accent">Account</p>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <p>Name: <span className="text-white">{user.name}</span></p>
                <p>Username: <span className="text-white">{user.username}</span></p>
                <p>Email: <span className="text-white">{user.email}</span></p>
                <p>Joined: <span className="text-white">{joinedDate}</span></p>
                {user.badges && user.badges.length > 0 && (
                  <div>
                    <p>Badges:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.badges.map((badge, index) => (
                        <span key={index} className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-slate-950">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
