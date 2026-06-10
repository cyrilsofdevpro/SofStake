'use client';

import React from 'react';
import { NormalizedToken } from '@/lib/dexscreener';
import { evaluateRugRisk } from '@/lib/rugCheck';

interface TokenCardProps {
  token: NormalizedToken;
  onSelect?: (token: NormalizedToken) => void;
  showRiskScore?: boolean;
}

export default function TokenCard({
  token,
  onSelect,
  showRiskScore = true,
}: TokenCardProps) {
  const priceChange = token.priceChange24h ?? 0;
  const isPositive = priceChange > 0;
  const rugRisk = showRiskScore ? evaluateRugRisk(token) : null;

  const getRiskColor = (label: string) => {
    switch (label) {
      case 'LOW':
        return 'text-green-400';
      case 'MEDIUM':
        return 'text-yellow-400';
      case 'HIGH':
        return 'text-orange-400';
      case 'EXTREME':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getRiskBgColor = (label: string) => {
    switch (label) {
      case 'LOW':
        return 'bg-green-900/20';
      case 'MEDIUM':
        return 'bg-yellow-900/20';
      case 'HIGH':
        return 'bg-orange-900/20';
      case 'EXTREME':
        return 'bg-red-900/20';
      default:
        return 'bg-gray-900/20';
    }
  };

  return (
    <div
      onClick={() => onSelect?.(token)}
      className="group cursor-pointer rounded-lg border border-purple-500/30 bg-gradient-to-br from-slate-900/50 to-slate-800/50 p-4 backdrop-blur transition-all hover:border-purple-500/60 hover:bg-gradient-to-br hover:from-slate-900/70 hover:to-slate-800/70 hover:shadow-lg hover:shadow-purple-500/20"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{token.symbol}</h3>
          <p className="text-xs text-gray-400">{token.name}</p>
        </div>
        {rugRisk && (
          <div
            className={`rounded px-2 py-1 text-xs font-semibold ${getRiskColor(
              rugRisk.label
            )} ${getRiskBgColor(rugRisk.label)}`}
          >
            {rugRisk.label}
          </div>
        )}
      </div>

      {/* Price and Change */}
      <div className="mb-3 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white">
            ${token.priceUsd.toFixed(8)}
          </span>
          <span
            className={`text-lg font-semibold ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {priceChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 border-t border-purple-500/20 pt-3 text-xs">
        <div>
          <p className="text-gray-400">Volume 24h</p>
          <p className="font-semibold text-gray-100">
            ${(token.volume24h / 1000000).toFixed(2)}M
          </p>
        </div>
        <div>
          <p className="text-gray-400">Liquidity</p>
          <p className="font-semibold text-gray-100">
            ${(token.liquidityUsd / 1000).toFixed(1)}K
          </p>
        </div>
      </div>

      {/* DEX Info */}
      <div className="mt-3 flex items-center justify-between border-t border-purple-500/20 pt-2">
        <p className="text-xs capitalize text-gray-400">{token.dex}</p>
        <p className="text-xs text-purple-400">{token.chainId}</p>
      </div>
    </div>
  );
}
