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
    const { amount, type, reference } = body;

    if (amount === undefined || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, type' },
        { status: 400 }
      );
    }

    const wallet = await db.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    if (type === 'increment') {
      const amountNum = Math.floor(amount);
      const updatedWallet = await db.wallet.update({
        where: { userId: user.id },
        data: {
          balance: {
            increment: amountNum,
          },
        },
      });

      // Create ledger entry
      const walletBefore = Number(wallet.balance);
      await db.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: 'REWARD',
          amount: amountNum,
          balanceBefore: walletBefore,
          balanceAfter: walletBefore + amountNum,
          source: 'wallet_update',
          reference: reference || undefined,
          status: 'COMPLETED',
        },
      });

      return NextResponse.json({
        success: true,
        wallet: {
          id: updatedWallet.id,
          balance: updatedWallet.balance,
          sofBalance: updatedWallet.sofBalance,
          usdBalance: updatedWallet.usdBalance,
        },
      });
    } else if (type === 'decrement') {
      const amountNum = Math.floor(amount);
      const walletNum = Number(wallet.balance);
      if (walletNum < amountNum) {
        return NextResponse.json(
          { error: 'Insufficient balance' },
          { status: 400 }
        );
      }

      const updatedWallet = await db.wallet.update({
        where: { userId: user.id },
        data: {
          balance: {
            decrement: amountNum,
          },
        },
      });

      // Create ledger entry
      await db.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: 'BET',
          amount: amountNum,
          balanceBefore: walletNum,
          balanceAfter: walletNum - amountNum,
          source: 'wallet_update',
          reference: reference || undefined,
          status: 'COMPLETED',
        },
      });

      return NextResponse.json({
        success: true,
        wallet: {
          id: updatedWallet.id,
          balance: updatedWallet.balance,
          sofBalance: updatedWallet.sofBalance,
          usdBalance: updatedWallet.usdBalance,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "increment" or "decrement"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating wallet:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update wallet' },
      { status: 500 }
    );
  }
}
