import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/protected-route';
import { db } from '@/lib/db';
import { placeBet } from '@/lib/bettingEngine';

export async function POST(request: NextRequest) {
  try {
    const user = withAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pairAddress, direction, stake, windowMinutes, entryPrice } = body;

    // Validate input
    if (!pairAddress || !direction || !stake || !windowMinutes || entryPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: pairAddress, direction, stake, windowMinutes, entryPrice' },
        { status: 400 }
      );
    }

    if (!['UP', 'DOWN'].includes(direction)) {
      return NextResponse.json(
        { error: 'Direction must be UP or DOWN' },
        { status: 400 }
      );
    }

    if (stake <= 0) {
      return NextResponse.json(
        { error: 'Stake must be greater than 0' },
        { status: 400 }
      );
    }

    if (windowMinutes <= 0) {
      return NextResponse.json(
        { error: 'Window must be greater than 0 minutes' },
        { status: 400 }
      );
    }

    // Get user's wallet
    const wallet = await db.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet || wallet.balance < BigInt(Math.floor(stake))) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance to place this bet' },
        { status: 400 }
      );
    }

    // Create the bet
    const bet = await db.cryptoBet.create({
      data: {
        userId: user.id,
        pairAddress,
        direction,
        stake: BigInt(Math.floor(stake)),
        windowMinutes,
        entryPrice: BigInt(Math.floor(entryPrice * 100)) / BigInt(100), // Store as 2 decimals
        resolveAt: new Date(Date.now() + windowMinutes * 60000),
        status: 'open',
      },
    });

    // Deduct from wallet
    await db.wallet.update({
      where: { userId: user.id },
      data: {
        balance: {
          decrement: BigInt(Math.floor(stake)),
        },
      },
    });

    // Create ledger entry
    await db.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        type: 'BET',
        amount: BigInt(Math.floor(stake)),
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance - BigInt(Math.floor(stake)),
        source: 'crypto_bet',
        reference: bet.id,
        status: 'COMPLETED',
      },
    });

    return NextResponse.json(
      {
        success: true,
        bet: {
          id: bet.id,
          pairAddress: bet.pairAddress,
          direction: bet.direction,
          stake: Number(bet.stake),
          windowMinutes: bet.windowMinutes,
          entryPrice: Number(bet.entryPrice),
          createdAt: bet.createdAt.toISOString(),
          resolveAt: bet.resolveAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error placing bet:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to place bet' },
      { status: 500 }
    );
  }
}
