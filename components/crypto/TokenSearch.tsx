'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { NormalizedToken } from '@/lib/dexscreener';
import TokenCard from './TokenCard';

interface TokenSearchProps {
  onSelectToken?: (token: NormalizedToken) => void;
  showLabel?: boolean;
}

export default function TokenSearch({
  onSelectToken,
  showLabel = true,
}: TokenSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NormalizedToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/crypto/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Search failed');
        }

        setResults(data.data);
        setIsOpen(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search error');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (token: NormalizedToken) => {
      onSelectToken?.(token);
      setQuery('');
      setResults([]);
      setIsOpen(false);
    },
    [onSelectToken]
  );

  return (
    <div className="relative">
      {showLabel && (
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Search Token
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          placeholder="Search by name or symbol..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          className="w-full rounded-lg border border-purple-500/30 bg-slate-900/50 px-4 py-2 text-white placeholder-gray-500 transition focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />

        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin">
            ⚡
          </span>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.trim() && (
        <div className="absolute top-full z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border border-purple-500/30 bg-slate-900/95 backdrop-blur">
          {error && (
            <div className="border-b border-purple-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {loading && (
            <div className="p-4 text-center text-gray-400">Searching...</div>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="p-4 text-center text-gray-400">
              No tokens found for "{query}"
            </div>
          )}

          {results.map((token) => (
            <div
              key={token.pairAddress}
              onClick={() => handleSelect(token)}
              className="cursor-pointer border-b border-purple-500/10 p-3 transition hover:bg-purple-500/10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{token.symbol}</p>
                  <p className="text-xs text-gray-400">{token.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    ${token.priceUsd.toFixed(8)}
                  </p>
                  <p
                    className={`text-xs ${
                      (token.priceChange24h ?? 0) > 0
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {(token.priceChange24h ?? 0) > 0 ? '+' : ''}
                    {(token.priceChange24h ?? 0).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
