'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getReferralStats, claimDailyBonus } from '@/lib/user';

export default function ReferralsPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [dailyBonus, setDailyBonus] = useState<{ success: boolean; amount?: number; streak?: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/auth');
      return;
    }
    setUser(storedUser);
    setStats(getReferralStats(storedUser.id));
  }, [router]);

  const handleCopyReferralCode = async () => {
    if (!stats?.referralCode) return;

    try {
      await navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClaimDailyBonus = () => {
    const result = claimDailyBonus();
    setDailyBonus(result);
    if (result.success && user) {
      // Refresh user data
      const updatedUser = getStoredUser();
      setUser(updatedUser);
      setStats(getReferralStats(updatedUser!.id));
    }
  };

  const shareReferralLink = () => {
    if (!stats?.referralCode) return;

    const shareText = `Join me on SofStake! Use my referral code ${stats.referralCode} to get started and we'll both earn bonuses! 🎰`;
    const shareUrl = `${window.location.origin}/auth?ref=${stats.referralCode}`;

    if (navigator.share) {
      navigator.share({
        title: 'Join SofStake',
        text: shareText,
        url: shareUrl
      });
    } else {
      // Fallback to copying
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user || !stats) return null;

  return (
    <main className="min-h-screen bg-background text-white pb-20 md:pb-0">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 md:py-16">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-accent">Earn & Grow</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold">Referrals & Bonuses</h1>
          </div>

          {/* Daily Bonus */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Daily Bonus</h3>
                <p className="text-sm text-slate-400">Claim your daily reward</p>
              </div>
              <div className="text-3xl">🎁</div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Current Streak: <span className="text-accent font-semibold">{user.loginStreak} days</span></p>
                <p className="text-xs text-slate-500">Next bonus: {user.loginStreak >= 10 ? '20 SOF' : user.loginStreak >= 7 ? '10 SOF' : user.loginStreak >= 3 ? '4 SOF' : '2 SOF'}</p>
              </div>
              <button
                onClick={handleClaimDailyBonus}
                className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent2"
              >
                Claim Bonus
              </button>
            </div>

            {dailyBonus && (
              <div className={`mt-4 p-3 rounded-lg ${dailyBonus.success ? 'bg-green-950/50 border border-green-500/20' : 'bg-red-950/50 border border-red-500/20'}`}>
                {dailyBonus.success ? (
                  <p className="text-green-400 text-sm">
                    🎉 Claimed {dailyBonus.amount} SOF! {dailyBonus.streak! > 1 ? `${dailyBonus.streak}-day streak bonus!` : 'Daily bonus claimed!'}
                  </p>
                ) : (
                  <p className="text-red-400 text-sm">Already claimed today. Come back tomorrow!</p>
                )}
              </div>
            )}
          </div>

          {/* Referral Code */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Your Referral Code</h3>
                <p className="text-sm text-slate-400">Share this code with friends</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex-1 rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 font-mono text-lg text-accent">
                {stats.referralCode}
              </div>
              <button
                onClick={handleCopyReferralCode}
                className="rounded-full bg-white/5 px-4 py-3 text-sm hover:bg-white/10 transition"
              >
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>

            <button
              onClick={shareReferralLink}
              className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent2"
            >
              Share Referral Link
            </button>
          </div>

          {/* Referral Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Friends Referred</p>
                  <p className="text-2xl font-bold text-accent">{stats.totalReferrals}</p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Referral Earnings</p>
                  <p className="text-2xl font-bold text-green-400">{stats.referralEarnings.toLocaleString()} SOF</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Bonus Earnings</p>
                  <p className="text-2xl font-bold text-yellow-400">{user.totalBonusEarnings.toLocaleString()} SOF</p>
                </div>
                <div className="text-3xl">🎁</div>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">How Referrals Work</h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-accent/20 text-accent w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                <p>Share your unique referral code with friends</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-accent/20 text-accent w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                <p>When they sign up using your code, you both get 2 SOF bonus</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-accent/20 text-accent w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                <p>Earn more with daily login bonuses and streaks</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}