// lib/games/coinflip.ts

export interface CoinFlipBet {
  userId: string;
  choice: 'heads' | 'tails';
  betAmount: number;
}

export interface CoinFlipResult {
  gameId: string;
  choice: 'heads' | 'tails';
  result: 'heads' | 'tails';
  won: boolean;
  betAmount: number;
  payout: number;
  winAmount: number;
  newBalance: number;
  multiplier: number;
}

export async function playCoinFlip(bet: CoinFlipBet): Promise<CoinFlipResult> {
  const response = await fetch('/api/games/coinflip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bet)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Game failed');
  }

  const data = await response.json();
  return data.data;
}

export async function getCoinFlipHistory(userId: string) {
  const response = await fetch(`/api/games/coinflip?userId=${userId}&action=history`);
  if (!response.ok) {
    throw new Error('Failed to fetch game history');
  }
  const data = await response.json();
  return data.data;
}

export async function getCoinFlipStats(userId: string) {
  const response = await fetch(`/api/games/coinflip?userId=${userId}&action=stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch game stats');
  }
  const data = await response.json();
  return data.data;
}
