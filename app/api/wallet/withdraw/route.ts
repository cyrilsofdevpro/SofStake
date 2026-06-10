import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, method } = await request.json();

    if (!userId || !amount || !method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum withdrawal is ₦100' },
        { status: 400 }
      );
    }

    // Fetch user wallet
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json(
        { error: 'User or wallet not found' },
        { status: 404 }
      );
    }

    // Check sufficient balance
    if (user.walletBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const reference = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const withdrawal = await db.withdrawalTransaction.create({
      data: {
        userId,
        amountRequested: amount,
        amountProcessed: 0,
        fee: Math.ceil(amount * 0.01), // 1% fee
        method,
        status: 'pending',
        reference,
        metadata: {
          initiatedAt: new Date().toISOString(),
          method
        }
      }
    });

    // Lock balance (don't deduct yet, just mark as pending)
    await db.wallet.update({
      where: { userId },
      data: {
        lockedBalance: {
          increment: amount
        }
      }
    });

    // Create ledger entry
    await db.ledgerEntry.create({
      data: {
        walletId: user.wallet.id,
        type: 'withdraw_request',
        amount: -amount,
        balanceBefore: user.wallet.balance,
        balanceAfter: user.wallet.balance.minus(amount),
        status: 'pending',
        reference,
        metadata: {
          method,
          fee: withdrawal.fee
        }
      }
    });

    return NextResponse.json({
      status: true,
      message: 'Withdrawal request submitted',
      data: {
        reference,
        amount,
        fee: withdrawal.fee,
        status: 'pending'
      }
    });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: error?.message || 'Withdrawal processing failed' },
      { status: 500 }
    );
  }
}
