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
        const res = await fetch('https://api.dexscreener.com/latest/dex/trending');
        if (!res.ok) throw new Error(`DexScreener ${res.status}`);
        const data = await res.json();

        const pairs = data?.pairs ?? [];
        // normalize similar to server
        const normalized = pairs
          .map((pair: any) => {
            const baseToken = pair.baseToken || pair.token || {};
            const quoteToken = pair.quoteToken || {};
            const priceUsd = Number(pair.priceUsd ?? 0) || 0;
            const liquidityUsd = Number(pair.liquidity?.usd ?? pair.liquidityUsd ?? 0) || 0;
            const volume24h = Number(pair.volume?.h24 ?? 0) || 0;
            const priceChange24h = Number(pair.priceChange?.h24 ?? pair.priceChange24h ?? 0) || 0;
            const pairAddress = String(pair.pairAddress ?? pair.address ?? '');

            return {
              name: String(baseToken.name ?? quoteToken.name ?? 'Unknown'),
              symbol: String(baseToken.symbol ?? quoteToken.symbol ?? 'N/A'),
              priceUsd,
              liquidityUsd,
              volume24h,
              priceChange24h,
              dex: String(pair.dexId ?? pair.dex ?? 'unknown'),
              pairAddress,
              chainId: String(pair.chainId ?? ''),
              quoteSymbol: String(quoteToken.symbol ?? ''),
              url: String(pair.url ?? ''),
              createdAt: pair.pairCreatedAt ? Number(pair.pairCreatedAt) : undefined,
            };
          })
          .filter((p: any) => p.pairAddress)
          .slice(0, 20);

        setTokens(normalized);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();

    // Refresh every 3 seconds for real-time feel
    const interval = setInterval(fetchTrending, 3000);
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
