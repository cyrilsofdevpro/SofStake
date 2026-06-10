'use client';

import React, { useEffect, useState } from 'react';
import { NormalizedToken } from '@/lib/dexscreener';
import TokenCard from './TokenCard';

interface TrendingTokensProps {
  onSelectToken?: (token: NormalizedToken) => void;
}

export default function TrendingTokens({
  onSelectToken,
}: TrendingTokensProps) {
  const [tokens, setTokens] = useState<NormalizedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/crypto/trending');
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch tokens');
        }

        setTokens(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();

    // Refresh every 15 seconds
    const interval = setInterval(fetchTrending, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && tokens.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">🔥 Trending Now</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-lg border border-purple-500/20 bg-slate-800/50"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">🔥 Trending Now</h2>
        {loading && <span className="animate-spin text-xl">⚡</span>}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-900/20 p-3 text-sm text-red-300">
          Error: {error}
        </div>
      )}

      {tokens.length === 0 ? (
        <div className="rounded-lg border border-purple-500/20 bg-slate-800/50 p-8 text-center">
          <p className="text-gray-400">No trending tokens available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tokens.map((token) => (
            <TokenCard
              key={token.pairAddress}
              token={token}
              onSelect={onSelectToken}
              showRiskScore
            />
          ))}
        </div>
      )}
    </div>
  );
}
