'use client';

import React, { useState } from 'react';
import { NormalizedToken } from '@/lib/dexscreener';
import TrendingTokens from '@/components/crypto/TrendingTokens';
import TokenSearch from '@/components/crypto/TokenSearch';
import CryptoBettingGame from '@/components/crypto/CryptoBettingGame';
import BettingHistory from '@/components/crypto/BettingHistory';

export default function CryptoBettingPage() {
  const [selectedToken, setSelectedToken] = useState<NormalizedToken | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'history'>('discover');

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
            🎰 Crypto Betting Arena
          </h1>
          <p className="text-gray-400">
            Predict token price movements and earn rewards
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-purple-500/20">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 transition ${
              activeTab === 'discover'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Discover & Bet
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 transition ${
              activeTab === 'history'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            My History
          </button>
        </div>

        {/* Main Content */}
        {activeTab === 'discover' ? (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: Trending & Search */}
            <div className="space-y-6 lg:col-span-2">
              <TrendingTokens onSelectToken={setSelectedToken} />

              <div className="rounded-lg border border-purple-500/30 bg-gradient-to-br from-slate-900/50 to-slate-800/50 p-6 backdrop-blur">
                <TokenSearch
                  onSelectToken={setSelectedToken}
                  showLabel={true}
                />
              </div>
            </div>

            {/* Right: Betting Game */}
            <div>
              <CryptoBettingGame
                token={selectedToken}
                onBack={selectedToken ? () => setSelectedToken(null) : undefined}
              />
            </div>
          </div>
        ) : (
          <BettingHistory />
        )}

        {/* Footer Info */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-purple-500/20 bg-slate-900/50 p-4">
            <div className="text-xs text-gray-400">How it Works</div>
            <ul className="mt-2 space-y-1 text-xs text-gray-300">
              <li>✓ Select a token</li>
              <li>✓ Predict UP or DOWN</li>
              <li>✓ Choose time window</li>
              <li>✓ Wait for result</li>
            </ul>
          </div>

          <div className="rounded-lg border border-purple-500/20 bg-slate-900/50 p-4">
            <div className="text-xs text-gray-400">Payout Structure</div>
            <ul className="mt-2 space-y-1 text-xs text-gray-300">
              <li>📈 Win: 1.8x stake</li>
              <li>📉 Lose: -stake</li>
              <li>⚖️ Tie: Return stake</li>
            </ul>
          </div>

          <div className="rounded-lg border border-purple-500/20 bg-slate-900/50 p-4">
            <div className="text-xs text-gray-400">Risk Score</div>
            <ul className="mt-2 space-y-1 text-xs text-gray-300">
              <li>🟢 LOW: Safe</li>
              <li>🟡 MEDIUM: Caution</li>
              <li>🔴 HIGH/EXTREME: Risky</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
