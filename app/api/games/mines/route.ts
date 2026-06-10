import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

interface MinesRoundMetadata {
  seed: string;
  gridSize: number;
  mineCount: number;
  betAmount: number;
  userId: string;
  picks: number[];
  status: 'active' | 'lost' | 'won';
}

function deterministicShuffle(seed: string, total: number) {
  const indices = Array.from({ length: total }, (_, index) => index);

  for (let i = total - 1; i > 0; i -= 1) {
    const hash = crypto.createHash('sha256').update(`${seed}:${i}`).digest('hex');
    const randomValue = parseInt(hash.slice(0, 8), 16);
    const j = randomValue % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices;
}

function getMineIndices(seed: string, gridSize: number, mineCount: number) {
  const totalTiles = gridSize * gridSize;
  const shuffled = deterministicShuffle(seed, totalTiles);
  return shuffled.slice(0, mineCount).sort((a, b) => a - b);
}

function calculateMinesMultiplier(picks: number, gridSize: number, mineCount: number) {
  const totalSafe = gridSize * gridSize - mineCount;
  const base = 0.18;
  const bonus = Math.pow(picks, 1.3) * 0.05;
  const multiplier = Math.min(10, 1 + picks * base + bonus);
  return Math.round(multiplier * 100) / 100;
}

function parseRoundMetadata(value: string | null): MinesRoundMetadata | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as MinesRoundMetadata;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (action === 'history') {
      const history = await db.gameHistory.findMany({
        where: { userId, gameType: 'mines' },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      return NextResponse.json({ status: true, data: history });
    }

    if (action === 'stats') {
      const games = await db.gameHistory.findMany({
        where: { userId, gameType: 'mines' }
      });

      const totalGames = games.length;
      const wonGames = games.filter((g) => g.status === 'won').length;
      const lostGames = games.filter((g) => g.status === 'lost').length;
      const totalBet = games.reduce((sum, g) => sum + Number(g.betAmount), 0);
      const totalPayout = games.reduce((sum, g) => sum + Number(g.payout), 0);
      const profit = totalPayout - totalBet;
      const winRate = totalGames > 0 ? Math.round((wonGames / totalGames) * 100) : 0;

      return NextResponse.json({
        status: true,
        data: { totalGames, wonGames, lostGames, winRate, totalBet, totalPayout, profit }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Mines game error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch mines game data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, betAmount, gridSize = 5, mineCount = 5, roundId, index } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'start-round') {
      if (!betAmount || betAmount < 50) {
        return NextResponse.json({ error: 'Minimum bet is ₦50' }, { status: 400 });
      }

      if (user.walletBalance < betAmount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }

      const validGridSize = [5, 6].includes(gridSize) ? gridSize : 5;
      const validMineCount = Math.min(
        Math.max(mineCount, validGridSize === 5 ? 5 : 8),
        validGridSize === 5 ? 7 : 10
      );

      const seed = crypto.randomBytes(32).toString('hex');
      const roundMetadata: MinesRoundMetadata = {
        seed,
        gridSize: validGridSize,
        mineCount: validMineCount,
        betAmount,
        userId,
        picks: [],
        status: 'active'
      };

      const round = await db.gameRound.create({
        data: {
          gameType: 'mines',
          status: 'active',
          multiplier: 1,
          provablyFairSeed: JSON.stringify(roundMetadata),
          totalWagers: betAmount
        }
      });

      await db.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: betAmount },
          lockedBalance: { increment: betAmount }
        }
      });

      await db.user.update({
        where: { id: userId },
        data: {
          walletBalance: { decrement: betAmount }
        }
      });

      await db.ledgerEntry.create({
        data: {
          walletId: user.wallet.id,
          type: 'stake_lock',
          amount: -betAmount,
          balanceBefore: user.walletBalance,
          balanceAfter: user.walletBalance.minus(betAmount),
          reference: round.id,
          metadata: {
            gameType: 'mines',
            gridSize: validGridSize,
            mineCount: validMineCount
          }
        }
      });

      await db.transaction.create({
        data: {
          userId,
          type: 'bet',
          amount: -betAmount,
          status: 'completed',
          metadata: { gameType: 'mines', roundId: round.id }
        }
      });

      return NextResponse.json({
        status: true,
        message: 'Mines round started',
        data: {
          roundId: round.id,
          gridSize: validGridSize,
          mineCount: validMineCount,
          multiplier: 1,
          betAmount
        }
      });
    }

    if (action === 'reveal') {
      if (!roundId || typeof index !== 'number') {
        return NextResponse.json({ error: 'roundId and tile index required' }, { status: 400 });
      }

      const round = await db.gameRound.findUnique({ where: { id: roundId } });
      if (!round) {
        return NextResponse.json({ error: 'Round not found' }, { status: 404 });
      }

      const metadata = parseRoundMetadata(round.provablyFairSeed);
      if (!metadata || metadata.userId !== userId || metadata.status !== 'active') {
        return NextResponse.json({ error: 'Invalid round' }, { status: 400 });
      }

      if (metadata.picks.includes(index)) {
        return NextResponse.json({ error: 'Tile already revealed' }, { status: 400 });
      }

      const mineIndices = getMineIndices(metadata.seed, metadata.gridSize, metadata.mineCount);
      const hitMine = mineIndices.includes(index);
      const updatedPicks = [...metadata.picks, index];

      if (hitMine) {
        const updatedMetadata: MinesRoundMetadata = { ...metadata, picks: updatedPicks, status: 'lost' };
        await db.gameRound.update({
          where: { id: roundId },
          data: {
            status: 'settled',
            multiplier: 0,
            provablyFairSeed: JSON.stringify(updatedMetadata)
          }
        });

        await db.wallet.update({
          where: { userId },
          data: {
            lockedBalance: { decrement: metadata.betAmount }
          }
        });

        await db.gameHistory.create({
          data: {
            userId,
            gameType: 'mines',
            roundId,
            betAmount: metadata.betAmount,
            payout: 0,
            winAmount: 0,
            result: 'lost',
            multiplier: 0,
            metadata: {
              gridSize: metadata.gridSize,
              mineCount: metadata.mineCount,
              picks: updatedPicks
            }
          }
        });

        return NextResponse.json({
          status: true,
          message: 'Mine triggered',
          data: {
            result: 'lost',
            hitIndex: index,
            mineIndices,
            multiplier: 0,
            picked: updatedPicks
          }
        });
      }

      const multiplier = calculateMinesMultiplier(updatedPicks.length, metadata.gridSize, metadata.mineCount);
      const updatedMetadata: MinesRoundMetadata = { ...metadata, picks: updatedPicks };

      await db.gameRound.update({
        where: { id: roundId },
        data: {
          multiplier,
          provablyFairSeed: JSON.stringify(updatedMetadata)
        }
      });

      return NextResponse.json({
        status: true,
        message: 'Tile revealed safely',
        data: {
          result: 'safe',
          picked: updatedPicks,
          multiplier,
          remaining: metadata.gridSize * metadata.gridSize - metadata.mineCount - updatedPicks.length
        }
      });
    }

    if (action === 'cashout') {
      if (!roundId) {
        return NextResponse.json({ error: 'roundId required' }, { status: 400 });
      }

      const round = await db.gameRound.findUnique({ where: { id: roundId } });
      if (!round) {
        return NextResponse.json({ error: 'Round not found' }, { status: 404 });
      }

      const metadata = parseRoundMetadata(round.provablyFairSeed);
      if (!metadata || metadata.userId !== userId || metadata.status !== 'active') {
        return NextResponse.json({ error: 'Invalid round' }, { status: 400 });
      }

      const multiplier = calculateMinesMultiplier(metadata.picks.length, metadata.gridSize, metadata.mineCount);
      const payout = Math.floor(metadata.betAmount * multiplier);
      const winAmount = payout - metadata.betAmount;

      await db.gameRound.update({
        where: { id: roundId },
        data: {
          status: 'settled',
          multiplier,
          provablyFairSeed: JSON.stringify({ ...metadata, status: 'won' })
        }
      });

      await db.wallet.update({
        where: { userId },
        data: {
          lockedBalance: { decrement: metadata.betAmount },
          balance: { increment: payout }
        }
      });

      await db.user.update({
        where: { id: userId },
        data: {
          walletBalance: { increment: payout }
        }
      });

      await db.transaction.create({
        data: {
          userId,
          type: 'reward',
          amount: payout,
          status: 'completed',
          metadata: { gameType: 'mines', roundId }
        }
      });

      await db.ledgerEntry.create({
        data: {
          walletId: user.wallet.id,
          type: 'stake_payout',
          amount: payout,
          balanceBefore: user.walletBalance,
          balanceAfter: user.walletBalance.plus(payout),
          reference: roundId,
          metadata: {
            gameType: 'mines',
            betAmount: metadata.betAmount,
            multiplier
          }
        }
      });

      await db.gameHistory.create({
        data: {
          userId,
          gameType: 'mines',
          roundId,
          betAmount: metadata.betAmount,
          payout,
          winAmount,
          result: 'won',
          multiplier,
          metadata: {
            gridSize: metadata.gridSize,
            mineCount: metadata.mineCount,
            picks: metadata.picks
          }
        }
      });

      return NextResponse.json({
        status: true,
        message: 'Cashed out successfully',
        data: {
          result: 'won',
          payout,
          winAmount,
          multiplier,
          newBalance: Number(user.walletBalance.plus(payout))
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Mines game error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to process mines game action' }, { status: 500 });
  }
}
