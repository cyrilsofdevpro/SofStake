'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { NormalizedToken } from '@/lib/dexscreener';

interface PricePoint {
  price: number;
  timestamp: number;
  change: number;
}

export function usePriceSimulator(
  initialPrice: number,
  updateInterval: number = 3000
) {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([
    { price: initialPrice, timestamp: Date.now(), change: 0 },
  ]);
  const [currentPrice, setCurrentPrice] = useState(initialPrice);

  useEffect(() => {
    const interval = setInterval(() => {
      setPriceHistory((prev) => {
        const lastPrice = prev[prev.length - 1].price;
        // Simulate price with 2-5% volatility
        const volatility = (Math.random() - 0.5) * 0.04;
        const newPrice = lastPrice * (1 + volatility);
        const change = ((newPrice - initialPrice) / initialPrice) * 100;

        const newPoint: PricePoint = {
          price: newPrice,
          timestamp: Date.now(),
          change,
        };

        setCurrentPrice(newPrice);
        return [...prev.slice(-59), newPoint]; // Keep last 60 points
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [initialPrice, updateInterval]);

  return { currentPrice, priceHistory };
}

interface CryptoBettingGameProps {
  token: NormalizedToken | null;
  onBack?: () => void;
}

export default function CryptoBettingGame({
  token,
  onBack,
}: CryptoBettingGameProps) {
  const [selectedDirection, setSelectedDirection] = useState<'UP' | 'DOWN' | null>(
    null
  );
  const [stakeAmount, setStakeAmount] = useState('10');
  const [windowMinutes, setWindowMinutes] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const { currentPrice, priceHistory } = usePriceSimulator(
    token?.priceUsd || 0,
    3000
  );

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/wallet/balance');
        const data = await res.json();
        if (data.success) {
          setWalletBalance(Number(data.wallet.balance));
        }
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      }
    };

    fetchBalance();
  }, []);

  const handlePlaceBet = async () => {
    if (!token || !selectedDirection) {
      setError('Please select a direction');
      return;
    }

    const stake = parseFloat(stakeAmount);
    if (isNaN(stake) || stake <= 0) {
      setError('Invalid stake amount');
      return;
    }

    if (stake > walletBalance) {
      setError('Insufficient balance');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/bet/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairAddress: token.pairAddress,
          direction: selectedDirection,
          stake,
          windowMinutes: parseInt(windowMinutes),
          entryPrice: token.priceUsd,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to place bet');
      }

      setSuccess(true);
      setSelectedDirection(null);
      setStakeAmount('10');

      // Update balance
      setWalletBalance(walletBalance - stake);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="rounded-lg border border-purple-500/30 bg-slate-900/50 p-8 text-center">
        <p className="text-gray-400">Select a token to start betting</p>
      </div>
    );
  }

  const priceChange =
    ((currentPrice - token.priceUsd) / token.priceUsd) * 100;
  const isPositive = priceChange > 0;

  return (
    <div className="space-y-6 rounded-lg border border-purple-500/30 bg-gradient-to-br from-slate-900/50 to-slate-800/50 p-6 backdrop-blur">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">{token.symbol}</h3>
          <p className="text-sm text-gray-400">{token.name}</p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="rounded px-3 py-1 text-sm text-gray-400 transition hover:bg-slate-700 hover:text-white"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Price Display */}
      <div className="space-y-2 border-b border-purple-500/20 pb-4">
        <p className="text-gray-400">Current Price</p>
        <div className="flex items-baseline justify-between">
          <span className="text-4xl font-bold text-white">
            ${currentPrice.toFixed(8)}
          </span>
          <span
            className={`text-xl font-semibold ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {priceChange.toFixed(2)}%
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Entry: ${token.priceUsd.toFixed(8)}
        </p>
      </div>

      {/* Direction Selection */}
      <div className="space-y-3">
        <p className="font-medium text-gray-300">Predict Price Movement</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedDirection('UP')}
            className={`rounded-lg border-2 py-4 transition ${
              selectedDirection === 'UP'
                ? 'border-green-500 bg-green-500/10 text-green-400'
                : 'border-green-500/30 text-green-400 hover:border-green-500/60'
            }`}
          >
            <div className="text-3xl">📈</div>
            <div className="mt-1 font-bold">UP</div>
          </button>
          <button
            onClick={() => setSelectedDirection('DOWN')}
            className={`rounded-lg border-2 py-4 transition ${
              selectedDirection === 'DOWN'
                ? 'border-red-500 bg-red-500/10 text-red-400'
                : 'border-red-500/30 text-red-400 hover:border-red-500/60'
            }`}
          >
            <div className="text-3xl">📉</div>
            <div className="mt-1 font-bold">DOWN</div>
          </button>
        </div>
      </div>

      {/* Stake Input */}
      <div className="space-y-2">
        <label className="block font-medium text-gray-300">
          Stake Amount (Balance: {walletBalance.toFixed(2)})
        </label>
        <input
          type="number"
          min="1"
          step="1"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          className="w-full rounded-lg border border-purple-500/30 bg-slate-900/50 px-4 py-2 text-white placeholder-gray-500 transition focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      {/* Time Window */}
      <div className="space-y-2">
        <p className="font-medium text-gray-300">Time Window</p>
        <div className="grid grid-cols-4 gap-2">
          {['1', '5', '15', '60'].map((minutes) => (
            <button
              key={minutes}
              onClick={() => setWindowMinutes(minutes)}
              className={`rounded py-2 transition ${
                windowMinutes === minutes
                  ? 'border-2 border-purple-500 bg-purple-500/20 text-purple-300'
                  : 'border border-purple-500/30 text-gray-400 hover:border-purple-500/60'
              }`}
            >
              {minutes}m
            </button>
          ))}
        </div>
      </div>

      {/* Payout Preview */}
      <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Potential Payout (Win):</span>
          <span className="font-semibold text-green-400">
            {(parseFloat(stakeAmount) * 1.8).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-900/20 p-3 text-sm text-red-300">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-900/20 p-3 text-sm text-green-300">
          ✅ Bet placed successfully!
        </div>
      )}

      {/* Place Bet Button */}
      <button
        onClick={handlePlaceBet}
        disabled={loading || !selectedDirection}
        className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-bold text-white transition disabled:opacity-50 hover:from-purple-700 hover:to-pink-700"
      >
        {loading ? 'Placing Bet...' : 'Place Bet'}
      </button>

      {/* Mini Chart */}
      <div className="space-y-2 border-t border-purple-500/20 pt-4">
        <p className="text-xs font-medium text-gray-400">Price Movement</p>
        <div className="h-16 rounded-lg bg-slate-800/50 p-2">
          <svg
            viewBox="0 0 60 16"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            {priceHistory.length > 1 && (
              <polyline
                points={priceHistory
                  .map((p, i) => {
                    const x = (i / (priceHistory.length - 1)) * 60;
                    const minPrice = Math.min(...priceHistory.map((h) => h.price));
                    const maxPrice = Math.max(...priceHistory.map((h) => h.price));
                    const range = maxPrice - minPrice || 1;
                    const y = ((maxPrice - p.price) / range) * 16;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="0.5"
              />
            )}
            <defs>
              <linearGradient
                id="gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}
