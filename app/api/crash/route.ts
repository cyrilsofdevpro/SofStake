import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Multiplier generator for crash game - simulates realistic crash points
function generateCrashMultiplier(): number {
  // 1% chance of crash at 1.01x
  if (Math.random() < 0.01) return 1.01;
  // 5% chance at 1.5x
  if (Math.random() < 0.05) return 1.5;
  // 10% chance at 2x
  if (Math.random() < 0.1) return 2.0;
  // 20% chance at 3x
  if (Math.random() < 0.2) return 3.0;
  // 30% chance at 5x
  if (Math.random() < 0.3) return 5.0;
  // 20% chance at 10x
  if (Math.random() < 0.2) return 10.0;
  // 14% chance at 20x+
  return Math.random() * 50 + 20;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const roundId = searchParams.get('roundId');

    if (action === 'status' && roundId) {
      // Get current round status
      const round = await db.gameRound.findUnique({
        where: { id: roundId },
        include: {
          bets: {
            where: { userId: userId || undefined },
            select: {
              id: true,
              betAmount: true,
              autoCashout: true,
              manualCashout: true,
              status: true,
              payout: true,
              winAmount: true
            }
          }
        }
      });

      if (!round) {
        return NextResponse.json({ error: 'Round not found' }, { status: 404 });
      }

      return NextResponse.json({
        status: true,
        data: {
          roundId: round.id,
          gameStatus: round.status,
          multiplier: round.multiplier,
          crashPoint: round.crashPoint,
          bets: round.bets
        }
      });
    }

    if (action === 'history' && userId) {
      // Get game history
      const history = await db.gameHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      return NextResponse.json({
        status: true,
        data: history
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Crash game error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch crash game data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, roundId, betAmount, autoCashout } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user and wallet
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'start-round') {
      // Start a new crash game round
      const crashPoint = generateCrashMultiplier();

      const round = await db.gameRound.create({
        data: {
          gameType: 'crash',
          status: 'active',
          multiplier: 1.0,
          crashPoint: Math.round(crashPoint * 100) / 100,
          provablyFairSeed: Math.random().toString(36).substring(2, 15)
        }
      });

      return NextResponse.json({
        status: true,
        message: 'Round started',
        data: {
          roundId: round.id,
          crashPoint: round.crashPoint
        }
      });
    }

    if (action === 'place-bet') {
      // Place a bet on an active round
      if (!roundId || !betAmount) {
        return NextResponse.json(
          { error: 'roundId and betAmount required' },
          { status: 400 }
        );
      }

      if (betAmount < 10) {
        return NextResponse.json(
          { error: 'Minimum bet is ₦10' },
          { status: 400 }
        );
      }

      if (user.walletBalance < betAmount) {
        return NextResponse.json(
          { error: 'Insufficient balance' },
          { status: 400 }
        );
      }

      // Get round
      const round = await db.gameRound.findUnique({
        where: { id: roundId }
      });

      if (!round) {
        return NextResponse.json({ error: 'Round not found' }, { status: 404 });
      }

      if (round.status !== 'active') {
        return NextResponse.json(
          { error: 'Round is not active' },
          { status: 400 }
        );
      }

      // Create bet
      const bet = await db.crashBet.create({
        data: {
          roundId,
          userId,
          betAmount,
          autoCashout: autoCashout || null,
          status: 'active',
          walletLocked: betAmount
        }
      });

      // Lock wallet balance
      await db.wallet.update({
        where: { userId },
        data: {
          lockedBalance: {
            increment: betAmount
          }
        }
      });

      // Deduct from wallet
      await db.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            decrement: betAmount
          }
        }
      });

      // Create ledger entry
      await db.ledgerEntry.create({
        data: {
          walletId: user.wallet.id,
          type: 'stake_lock',
          amount: -betAmount,
          balanceBefore: user.walletBalance,
          balanceAfter: user.walletBalance.minus(betAmount),
          reference: bet.id,
          metadata: {
            roundId,
            betId: bet.id
          }
        }
      });

      return NextResponse.json({
        status: true,
        message: 'Bet placed',
        data: {
          betId: bet.id,
          roundId,
          betAmount,
          status: 'active'
        }
      });
    }

    if (action === 'cashout') {
      // Manual cashout
      if (!roundId) {
        return NextResponse.json({ error: 'roundId required' }, { status: 400 });
      }

      // Get round and bet
      const round = await db.gameRound.findUnique({
        where: { id: roundId },
        include: { bets: { where: { userId } } }
      });

      if (!round) {
        return NextResponse.json({ error: 'Round not found' }, { status: 404 });
      }

      const bet = round.bets[0];
      if (!bet) {
        return NextResponse.json(
          { error: 'No active bet found for this round' },
          { status: 404 }
        );
      }

      if (bet.status !== 'active') {
        return NextResponse.json(
          { error: 'Bet is not active' },
          { status: 400 }
        );
      }

      // Calculate winnings
      const multiplier = Number(round.multiplier);
      const betAmount = Number(bet.betAmount);
      const winAmount = Math.floor(betAmount * multiplier);

      // Update bet
      const updatedBet = await db.crashBet.update({
        where: { id: bet.id },
        data: {
          status: 'cashed_out',
          manualCashout: multiplier,
          payout: winAmount,
          winAmount: winAmount - betAmount,
          cashedOutAt: new Date()
        }
      });

      // Release locked balance and credit winnings
      await db.wallet.update({
        where: { userId },
        data: {
          lockedBalance: {
            decrement: bet.walletLocked
          }
        }
      });

      await db.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            increment: winAmount
          }
        }
      });

      // Create winning transaction
      await db.transaction.create({
        data: {
          userId,
          type: 'REWARD',
          amount: winAmount,
          status: 'completed',
          metadata: {
            roundId,
            betId: bet.id,
            multiplier,
            betAmount: bet.betAmount
          }
        }
      });

      // Create ledger entry
      await db.ledgerEntry.create({
        data: {
          walletId: user.wallet.id,
          type: 'stake_payout',
          amount: winAmount,
          balanceBefore: user.walletBalance,
          balanceAfter: user.walletBalance.plus(winAmount),
          reference: bet.id,
          metadata: {
            roundId,
            multiplier,
            betAmount: bet.betAmount
          }
        }
      });

      // Add to game history
      await db.gameHistory.create({
        data: {
          userId,
          gameType: 'crash',
          betAmount: bet.betAmount,
          payout: winAmount,
          winAmount: winAmount - Number(bet.betAmount),
          multiplier,
          result: 'won',
          metadata: {
            roundId
          }
        }
      });

      return NextResponse.json({
        status: true,
        message: 'Cashed out successfully',
        data: {
          multiplier,
          betAmount: bet.betAmount,
          winAmount: winAmount - Number(bet.betAmount),
          totalPayout: winAmount
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Crash game error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process crash game action' },
      { status: 500 }
    );
  }
}
