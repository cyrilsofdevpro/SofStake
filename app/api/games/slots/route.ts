import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

const SYMBOLS = [
  { id: 'cherry', label: '🍒', weight: 26, payout: { 3: 1.5, 4: 4, 5: 8 } },
  { id: 'lemon', label: '🍋', weight: 22, payout: { 3: 1.2, 4: 3, 5: 6 } },
  { id: 'grape', label: '🍇', weight: 18, payout: { 3: 1.8, 4: 4.5, 5: 9 } },
  { id: 'bar', label: 'BAR', weight: 14, payout: { 3: 2.5, 4: 6, 5: 12 } },
  { id: 'seven', label: '7️⃣', weight: 10, payout: { 3: 4, 4: 10, 5: 25 } },
  { id: 'diamond', label: '💎', weight: 8, payout: { 3: 5, 4: 12, 5: 30 } }
];

const PAYLINES = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2]
];

const GRID_ROWS = 3;
const GRID_REELS = 5;

function buildStrip() {
  return SYMBOLS.flatMap((symbol) => Array(symbol.weight).fill(symbol.id));
}

const REEL_STRIP = buildStrip();
const STRIP_LENGTH = REEL_STRIP.length;

function deterministicIndex(seed: string, reel: number) {
  const hash = crypto.createHash('sha256').update(`${seed}:${reel}`).digest('hex');
  const value = parseInt(hash.slice(0, 8), 16);
  return value % STRIP_LENGTH;
}

function symbolById(id: string) {
  return SYMBOLS.find((symbol) => symbol.id === id) ?? SYMBOLS[0];
}

function buildGrid(seed: string) {
  const grid: string[][] = Array.from({ length: GRID_ROWS }, () => Array(GRID_REELS).fill(''));

  for (let reel = 0; reel < GRID_REELS; reel += 1) {
    const stop = deterministicIndex(seed, reel);
    for (let row = 0; row < GRID_ROWS; row += 1) {
      const symbolId = REEL_STRIP[(stop + row) % STRIP_LENGTH];
      grid[row][reel] = symbolId;
    }
  }

  return grid;
}

function evaluateGrid(grid: string[][], betAmount: number) {
  const lineResults = PAYLINES.map((line) => {
    const symbols = line.map((row, reel) => grid[row][reel]);
    const first = symbols[0];

    let count = 1;
    for (let i = 1; i < symbols.length; i += 1) {
      if (symbols[i] === first) {
        count += 1;
      } else {
        break;
      }
    }

    if (count < 3) return null;
    const symbol = symbolById(first);
    const payMultiplier = symbol.payout[count as 3 | 4 | 5] ?? 0;
    return {
      line,
      symbol: symbol.label,
      symbolId: symbol.id,
      count,
      multiplier: payMultiplier,
      payout: Math.floor(betAmount * payMultiplier)
    };
  });

  const wins = lineResults.filter((line): line is NonNullable<typeof line> => line !== null);
  const totalPayout = wins.reduce((sum, win) => sum + win.payout, 0);
  return { wins, totalPayout };
}

function parseMetadata(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (action === 'history') {
      const history = await db.gameHistory.findMany({
        where: { userId, gameType: 'slot' },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      return NextResponse.json({ status: true, data: history });
    }

    if (action === 'stats') {
      const history = await db.gameHistory.findMany({ where: { userId, gameType: 'slot' } });
      const totalGames = history.length;
      const wonGames = history.filter((game) => game.result === 'won').length;
      const lostGames = history.filter((game) => game.result === 'lost').length;
      const totalBet = history.reduce((sum, game) => sum + Number(game.betAmount), 0);
      const totalPayout = history.reduce((sum, game) => sum + Number(game.payout), 0);
      const profit = totalPayout - totalBet;
      const winRate = totalGames > 0 ? Math.round((wonGames / totalGames) * 100) : 0;
      return NextResponse.json({ status: true, data: { totalGames, wonGames, lostGames, winRate, totalBet, totalPayout, profit } });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Slots GET error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch slots data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, betAmount } = body;

    if (!userId || !betAmount) {
      return NextResponse.json({ error: 'userId and betAmount required' }, { status: 400 });
    }

    if (betAmount < 50) {
      return NextResponse.json({ error: 'Minimum bet is ₦50' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId }, include: { wallet: true } });
    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.walletBalance < betAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const seed = crypto.randomBytes(32).toString('hex');
    const grid = buildGrid(seed);
    const evaluation = evaluateGrid(grid, betAmount);
    const payout = evaluation.totalPayout;
    const multiplier = payout > 0 ? Math.round((payout / betAmount) * 100) / 100 : 0;
    const won = payout > 0;

    const round = await db.gameRound.create({
      data: {
        gameType: 'slot',
        status: 'settled',
        multiplier: multiplier || 0,
        provablyFairSeed: JSON.stringify({ seed, grid }),
        totalWagers: betAmount,
        totalPayouts: payout
      }
    });

    await db.wallet.update({
      where: { userId },
      data: {
        balance: { decrement: betAmount }
      }
    });

    await db.user.update({
      where: { id: userId },
      data: {
        walletBalance: { decrement: betAmount }
      }
    });

    if (payout > 0) {
      await db.wallet.update({
        where: { userId },
        data: {
          balance: { increment: payout }
        }
      });

      await db.user.update({
        where: { id: userId },
        data: {
          walletBalance: { increment: payout }
        }
      });
    }

    await db.transaction.create({
      data: {
        userId,
        type: 'BET',
        amount: -betAmount,
        status: 'completed',
        metadata: { gameType: 'slot', roundId: round.id }
      }
    });

    if (payout > 0) {
      await db.transaction.create({
        data: {
          userId,
          type: 'REWARD',
          amount: payout,
          status: 'completed',
          metadata: { gameType: 'slot', roundId: round.id, multiplier }
        }
      });
    }

    await db.ledgerEntry.create({
      data: {
        walletId: user.wallet.id,
        type: 'stake_lock',
        amount: -betAmount,
        balanceBefore: user.walletBalance,
        balanceAfter: user.walletBalance.minus(betAmount),
        reference: round.id,
        metadata: { gameType: 'slot', betAmount, seed }
      }
    });

    if (payout > 0) {
      await db.ledgerEntry.create({
        data: {
          walletId: user.wallet.id,
          type: 'stake_payout',
          amount: payout,
          balanceBefore: user.walletBalance.minus(betAmount),
          balanceAfter: user.walletBalance.minus(betAmount).plus(payout),
          reference: round.id,
          metadata: { gameType: 'slot', multiplier }
        }
      });
    }

    await db.gameHistory.create({
      data: {
        userId,
        gameType: 'slot',
        betAmount,
        payout,
        winAmount: payout - betAmount,
        result: won ? 'won' : 'lost',
        multiplier: multiplier || 0,
        metadata: { grid, wins: evaluation.wins }
      }
    });

    return NextResponse.json({
      status: true,
      message: won ? 'Slot win!' : 'No win this spin',
      data: {
        roundId: round.id,
        grid,
        wins: evaluation.wins,
        payout,
        multiplier,
        newBalance: Number(user.walletBalance.minus(betAmount).plus(payout))
      }
    });
  } catch (error: any) {
    console.error('Slots POST error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to process slot spin' }, { status: 500 });
  }
}
