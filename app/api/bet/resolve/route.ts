import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/protected-route';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = withAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { betId, currentPrice } = body;

    if (!betId || currentPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: betId, currentPrice' },
        { status: 400 }
      );
    }

    // Get the bet
    const bet = await db.cryptoBet.findUnique({
      where: { id: betId },
    });

    if (!bet) {
      return NextResponse.json(
        { error: 'Bet not found' },
        { status: 404 }
      );
    }

    if (bet.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (bet.status !== 'open') {
      return NextResponse.json(
        { error: 'Bet is already resolved' },
        { status: 400 }
      );
    }

    // Calculate outcome
    const entryPrice = Number(bet.entryPrice);
    const stakeAmount = Number(bet.stake);
    const delta = currentPrice - entryPrice;
    const isTie = Math.abs(delta) < 0.0001;
    const isCorrect = bet.direction === 'UP' ? delta > 0 : delta < 0;
    const payout = isTie ? stakeAmount : isCorrect ? Math.round(stakeAmount * 1.8) : 0;
    const outcome = isTie ? 'TIE' : isCorrect ? 'WIN' : 'LOSS';

    // Get wallet
    const wallet = await db.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Update bet
    const updatedBet = await db.cryptoBet.update({
      where: { id: betId },
      data: {
        status: 'resolved',
        outcome,
        resultPrice: currentPrice,
        payout,
        resolvedAt: new Date(),
      },
    });

    // Update wallet if won
    if (payout > 0) {
      await db.wallet.update({
        where: { userId: user.id },
        data: {
          balance: {
            increment: payout,
          },
        },
      });

      // Create ledger entry for payout
      const walletBefore = Number(wallet.balance);
      const walletAfter = walletBefore + payout;
      await db.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: 'REWARD',
          amount: payout,
          balanceBefore: walletBefore,
          balanceAfter: walletAfter,
          source: 'crypto_bet_win',
          reference: betId,
          status: 'COMPLETED',
        },
      });
    }

    return NextResponse.json({
      success: true,
      bet: {
        id: updatedBet.id,
        pairAddress: updatedBet.pairAddress,
        direction: updatedBet.direction,
        stake: Number(updatedBet.stake),
        entryPrice: Number(updatedBet.entryPrice),
        resultPrice: updatedBet.resultPrice ? Number(updatedBet.resultPrice) : null,
        outcome: updatedBet.outcome,
        payout: Number(updatedBet.payout),
        resolvedAt: updatedBet.resolvedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error resolving bet:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resolve bet' },
      { status: 500 }
    );
  }
}
