export type BetDirection = 'UP' | 'DOWN';
export type BetStatus = 'OPEN' | 'RESOLVED';
export type BetOutcome = 'WIN' | 'LOSS' | 'TIE';

export type Bet = {
  id: string;
  userId: string;
  pairAddress: string;
  direction: BetDirection;
  stake: number;
  windowMinutes: number;
  entryPrice: number;
  createdAt: number;
  resolveAt: number;
  status: BetStatus;
  outcome?: BetOutcome;
  payout?: number;
  resultPrice?: number;
};

const DEFAULT_POINTS = 1000;
const bets = new Map<string, Bet>();
const pointsStore = new Map<string, number>();

function ensurePoints(userId: string) {
  if (!pointsStore.has(userId)) {
    pointsStore.set(userId, DEFAULT_POINTS);
  }
  return pointsStore.get(userId)!;
}

export function getUserPoints(userId: string) {
  return ensurePoints(userId);
}

export function updateUserPoints(userId: string, amount: number) {
  const current = ensurePoints(userId);
  const next = Math.max(0, current + amount);
  pointsStore.set(userId, next);
  return next;
}

export function placeBet(
  userId: string,
  pairAddress: string,
  direction: BetDirection,
  stake: number,
  windowMinutes: number,
  entryPrice: number
): Bet {
  if (!userId || !pairAddress) {
    throw new Error('userId and pairAddress are required.');
  }

  if (stake <= 0) {
    throw new Error('Stake must be greater than zero.');
  }

  const balance = ensurePoints(userId);
  if (stake > balance) {
    throw new Error('Insufficient points to place this bet.');
  }

  const betId = crypto.randomUUID();
  const now = Date.now();
  const bet: Bet = {
    id: betId,
    userId,
    pairAddress,
    direction,
    stake,
    windowMinutes,
    entryPrice,
    createdAt: now,
    resolveAt: now + windowMinutes * 60000,
    status: 'OPEN',
  };

  updateUserPoints(userId, -stake);
  bets.set(betId, bet);

  return bet;
}

export function calculateOutcome(
  entryPrice: number,
  currentPrice: number,
  direction: BetDirection,
  stake: number
) {
  const delta = currentPrice - entryPrice;
  const isTie = Math.abs(delta) < 1e-9;
  const isCorrect = direction === 'UP' ? delta > 0 : delta < 0;
  const payout = isTie ? stake : isCorrect ? Math.round(stake * 1.8) : 0;
  const profit = payout - stake;
  const outcome: BetOutcome = isTie ? 'TIE' : isCorrect ? 'WIN' : 'LOSS';

  return { outcome, payout, profit };
}

export function resolveBet(betId: string, currentPrice: number) {
  const bet = bets.get(betId);
  if (!bet) {
    throw new Error('Bet not found.');
  }

  if (bet.status !== 'OPEN') {
    return bet;
  }

  const resolution = calculateOutcome(bet.entryPrice, currentPrice, bet.direction, bet.stake);
  bet.status = 'RESOLVED';
  bet.outcome = resolution.outcome;
  bet.payout = resolution.payout;
  bet.resultPrice = currentPrice;

  if (resolution.payout > 0) {
    updateUserPoints(bet.userId, resolution.payout);
  }

  bets.set(betId, bet);
  return bet;
}

export function getOpenBets(userId: string) {
  return Array.from(bets.values()).filter((bet) => bet.userId === userId);
}

export function getBet(betId: string) {
  return bets.get(betId);
}
