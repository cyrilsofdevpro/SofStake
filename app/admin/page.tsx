'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getAllUsers, StoredUser, Transaction } from '@/lib/user';

interface AdminTransaction extends Transaction {
  userId: string;
  username: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  liveMatches: number;
  totalProfit: number;
  suspiciousActivities: SuspiciousActivity[];
  recentTransactions: AdminTransaction[];
}

interface SuspiciousActivity {
  id: string;
  type: 'large_withdrawal' | 'rapid_transactions' | 'unusual_pattern';
  userId: string;
  username: string;
  description: string;
  amount?: number;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = () => {
    const user = getStoredUser();
    if (user && user.badges.includes('Admin')) {
      setIsAdmin(true);
      loadAdminStats();
    } else {
      setLoading(false);
    }
  };

  const loadAdminStats = () => {
    const allUsers = getAllUsers();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Calculate stats
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(user =>
      new Date(user.lastLogin) > oneHourAgo
    ).length;

    // Calculate financial stats
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalHouseProfit = 0;
    const recentTransactions: AdminTransaction[] = [];
    const suspiciousActivities: SuspiciousActivity[] = [];

    allUsers.forEach(user => {
      if (user.transactions) {
        user.transactions.forEach(transaction => {
          // Add to recent transactions (last 24 hours)
          if (new Date(transaction.timestamp) > new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
            recentTransactions.push({
              ...transaction,
              userId: user.id,
              username: user.username
            } as Transaction & { userId: string; username: string });
          }

          switch (transaction.type) {
            case 'deposit':
              totalDeposits += transaction.amount;
              break;
            case 'withdraw':
              totalWithdrawals += Math.abs(transaction.amount);
              break;
            case 'win':
              totalHouseProfit -= transaction.amount; // House loses when player wins
              break;
            case 'loss':
              totalHouseProfit += Math.abs(transaction.amount); // House gains when player loses
              break;
            case 'fee':
              totalHouseProfit += Math.abs(transaction.amount); // House keeps the fees
              break;
          }

          // Detect suspicious activities
          detectSuspiciousActivity(user, transaction, suspiciousActivities);
        });
      }
    });

    // Sort recent transactions by timestamp (newest first)
    recentTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Get live matches (will be 0 until real-time game tracking is implemented)
    const liveMatches = 0; // TODO: Implement real-time game tracking

    setStats({
      totalUsers,
      activeUsers,
      totalDeposits,
      totalWithdrawals,
      liveMatches,
      totalProfit: totalHouseProfit,
      suspiciousActivities: suspiciousActivities.slice(0, 10), // Show last 10
      recentTransactions: recentTransactions.slice(0, 20) // Show last 20
    });

    setLoading(false);
  };

  const detectSuspiciousActivity = (user: StoredUser, transaction: Transaction, activities: SuspiciousActivity[]) => {
    const amount = Math.abs(transaction.amount);

    // Large withdrawal
    if (transaction.type === 'withdraw' && amount > 50000) {
      activities.push({
        id: crypto.randomUUID(),
        type: 'large_withdrawal',
        userId: user.id,
        username: user.username,
        description: `Large withdrawal of ₦${amount.toLocaleString()}`,
        amount,
        timestamp: transaction.timestamp,
        severity: 'high'
      });
    }

    // Rapid transactions (more than 10 in last hour)
    const recentTransactions = user.transactions?.filter(t =>
      new Date(t.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
    ) || [];

    if (recentTransactions.length > 10) {
      const existingActivity = activities.find(a =>
        a.type === 'rapid_transactions' && a.userId === user.id
      );

      if (!existingActivity) {
        activities.push({
          id: crypto.randomUUID(),
          type: 'rapid_transactions',
          userId: user.id,
          username: user.username,
          description: `${recentTransactions.length} transactions in the last hour`,
          timestamp: new Date().toISOString(),
          severity: 'medium'
        });
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return date.toLocaleDateString();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'low': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-white pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 md:py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-slate-400">Loading admin dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background text-white pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 md:py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-slate-400 mb-6">You don't have permission to access the admin dashboard.</p>
            <button
              onClick={() => router.push('/')}
              className="rounded-full bg-accent px-6 py-3 text-slate-950 font-semibold hover:bg-accent2 transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!stats) return null;

  return (
    <main className="min-h-screen bg-background text-white pb-20 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 md:py-16">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-accent">Admin Dashboard</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold">Real-Time Platform Overview</h1>
          </div>
          <button
            onClick={loadAdminStats}
            className="rounded-full bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Real-time Data Notice */}
        {stats.totalUsers === 0 && (
          <div className="rounded-3xl border border-blue-500/20 bg-blue-950/20 p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="text-3xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-blue-400">Ready for Real-Time Data</h3>
                <p className="text-slate-300">Dashboard is live and monitoring. User registrations, deposits, games, and transactions will appear here automatically.</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid gap-4 sm:gap-6 mb-8 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Users (1h)</p>
                <p className="text-2xl font-bold text-green-400">{stats.activeUsers}</p>
              </div>
              <div className="text-3xl">🟢</div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Live Matches</p>
                <p className="text-2xl font-bold text-blue-400">{stats.liveMatches}</p>
              </div>
              <div className="text-3xl">🎮</div>
            </div>
          </div>

          <div className={`rounded-3xl border bg-slate-950/80 p-6 ${stats.totalProfit >= 0 ? 'border-green-500/20' : 'border-red-500/20'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">House Profit</p>
                <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(stats.totalProfit)}
                </p>
              </div>
              <div className="text-3xl">{stats.totalProfit >= 0 ? '💰' : '📉'}</div>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid gap-6 mb-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Financial Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Total Deposits</span>
                <span className="text-green-400 font-semibold">{formatCurrency(stats.totalDeposits)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Total Withdrawals</span>
                <span className="text-red-400 font-semibold">{formatCurrency(stats.totalWithdrawals)}</span>
              </div>
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Net Flow</span>
                  <span className={`font-bold ${stats.totalDeposits - stats.totalWithdrawals >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(stats.totalDeposits - stats.totalWithdrawals)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Profit Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">From Game Losses</span>
                <span className="text-green-400 font-semibold">
                  {formatCurrency(stats.totalProfit * 0.7)} {/* Estimated */}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">From Fees</span>
                <span className="text-green-400 font-semibold">
                  {formatCurrency(stats.totalProfit * 0.3)} {/* Estimated */}
                </span>
              </div>
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Total House Profit</span>
                  <span className={`font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(stats.totalProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions & Suspicious Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Transactions */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.recentTransactions.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No recent transactions</p>
              ) : (
                stats.recentTransactions.map((transaction) => (
                  <div key={`${transaction.userId}-${transaction.id}`} className="flex items-center justify-between p-3 rounded-2xl bg-black/30">
                    <div className="flex items-center gap-3">
                      <div className="text-lg">
                        {transaction.type === 'deposit' ? '💳' :
                         transaction.type === 'withdraw' ? '💰' :
                         transaction.type === 'win' ? '🏆' :
                         transaction.type === 'loss' ? '😢' : '💱'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{transaction.username}</p>
                        <p className="text-xs text-slate-400 capitalize">{transaction.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      <p className="text-xs text-slate-500">{formatTime(transaction.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Suspicious Activity */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Suspicious Activity</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.suspiciousActivities.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No suspicious activity detected</p>
              ) : (
                stats.suspiciousActivities.map((activity) => (
                  <div key={activity.id} className="p-3 rounded-2xl bg-black/30 border-l-4 border-l-red-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">{activity.username}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(activity.severity)}`}>
                            {activity.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">{activity.description}</p>
                        {activity.amount && (
                          <p className="text-sm text-red-400 font-semibold mt-1">
                            Amount: {formatCurrency(activity.amount)}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 ml-2">
                        {formatTime(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}