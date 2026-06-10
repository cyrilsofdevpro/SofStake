export interface MinesRoundStartRequest {
  userId: string;
  betAmount: number;
  gridSize: number;
  mineCount: number;
}

export interface MinesRoundStartResponse {
  roundId: string;
  gridSize: number;
  mineCount: number;
  multiplier: number;
  betAmount: number;
}

export interface MinesRevealResponse {
  result: 'safe' | 'lost';
  picked: number[];
  multiplier: number;
  remaining?: number;
  mineIndices?: number[];
}

export interface MinesCashoutResponse {
  result: 'won';
  payout: number;
  winAmount: number;
  multiplier: number;
  newBalance: number;
}

export async function startMinesRound(request: MinesRoundStartRequest): Promise<MinesRoundStartResponse> {
  const response = await fetch('/api/games/mines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'start-round', ...request })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to start mines round');
  }

  return data.data;
}

export async function revealMinesTile(userId: string, roundId: string, index: number): Promise<MinesRevealResponse> {
  const response = await fetch('/api/games/mines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reveal', userId, roundId, index })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to reveal tile');
  }

  return data.data;
}

export async function cashoutMinesRound(userId: string, roundId: string): Promise<MinesCashoutResponse> {
  const response = await fetch('/api/games/mines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cashout', userId, roundId })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to cash out');
  }

  return data.data;
}
