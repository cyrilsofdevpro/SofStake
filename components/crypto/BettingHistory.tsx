'use client';

import React, { useEffect, useState } from 'react';

interface Bet {
  id: string;
  pairAddress: string;
  direction: string;
  stake: number;
  windowMinutes: number;
  entryPrice: number;
  resultPrice: number | null;
  outcome: string | null;
  payout: number;
  status: string;
  createdAt: string;
  resolveAt: string;
  resolvedAt: string | null;
}

export default function BettingHistory() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  useEffect(() => {
    const fetchBets = async () => {
      try {
        setLoading(true);
        setError(null);
        const status = filter === 'all' ? undefined : filter;
        const query = status ? `?status=${status}` : '';
        const res = await fetch(`/api/bet/history${query}`);
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch bets');
        }

        setBets(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, [filter]);

  const getOutcomeColor = (outcome: string | null) => {
    switch (outcome) {
      case 'WIN':
        return 'text-green-400';
      case 'LOSS':
        return 'text-red-400';
      case 'TIE':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'resolved'
      ? 'bg-purple-500/20 text-purple-300'
      : 'bg-yellow-500/20 text-yellow-300';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">📊 Betting History</h2>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(['all', 'open', 'resolved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 capitalize transition ${
              filter === f
                ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                : 'border border-purple-500/30 text-gray-400 hover:border-purple-500/60'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/50 bg-red-900/20 p-3 text-red-300">
          Error: {error}
        </div>
      ) : bets.length === 0 ? (
        <div className="rounded-lg border border-purple-500/20 bg-slate-800/50 p-8 text-center text-gray-400">
          No bets found
        </div>
      ) : (
        <div className="space-y-2">
          {bets.map((bet) => (
            <div
              key={bet.id}
              className="rounded-lg border border-purple-500/20 bg-slate-900/50 p-4"
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                {/* Token */}
                <div>
                  <p className="text-xs text-gray-400">Token</p>
                  <p className="font-semibold text-white">
                    {bet.pairAddress.slice(0, 8)}...
                  </p>
                </div>

                {/* Direction & Outcome */}
                <div>
                  <p className="text-xs text-gray-400">Direction</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {bet.direction === 'UP' ? '📈' : '📉'}
                    </span>
                    <span className="font-semibold text-white">
                      {bet.direction}
                    </span>
                  </div>
                </div>

                {/* Stake */}
                <div>
                  <p className="text-xs text-gray-400">Stake</p>
                  <p className="font-semibold text-white">
                    {bet.stake.toFixed(2)}
                  </p>
                </div>

                {/* Payout */}
                <div>
                  <p className="text-xs text-gray-400">Payout</p>
                  <p className={`font-semibold ${getOutcomeColor(bet.outcome)}`}>
                    {bet.payout.toFixed(2)}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <p className={`rounded px-2 py-1 text-xs font-semibold ${getStatusBadge(bet.status)}`}>
                    {bet.status}
                  </p>
                </div>

                {/* Outcome */}
                {bet.outcome && (
                  <div>
                    <p className="text-xs text-gray-400">Result</p>
                    <p className={`font-bold ${getOutcomeColor(bet.outcome)}`}>
                      {bet.outcome}
                    </p>
                  </div>
                )}
              </div>

              {/* Expanded Info */}
              <div className="mt-3 border-t border-purple-500/10 pt-3 text-xs text-gray-500">
                <p>
                  Entry: ${bet.entryPrice.toFixed(8)} | Window: {bet.windowMinutes}m |
                  Created: {new Date(bet.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
