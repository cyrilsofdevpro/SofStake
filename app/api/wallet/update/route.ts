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
      const updatedWallet = await db.wallet.update({
        where: { userId: user.id },
        data: {
          balance: {
            increment: BigInt(Math.floor(amount)),
          },
        },
      });

      // Create ledger entry
      await db.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: 'REWARD',
          amount: BigInt(Math.floor(amount)),
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance + BigInt(Math.floor(amount)),
          source: 'wallet_update',
          reference: reference || undefined,
          status: 'COMPLETED',
        },
      });

      return NextResponse.json({
        success: true,
        wallet: {
          id: updatedWallet.id,
          balance: Number(updatedWallet.balance),
          sofBalance: Number(updatedWallet.sofBalance),
          usdBalance: Number(updatedWallet.usdBalance),
        },
      });
    } else if (type === 'decrement') {
      if (wallet.balance < BigInt(Math.floor(amount))) {
        return NextResponse.json(
          { error: 'Insufficient balance' },
          { status: 400 }
        );
      }

      const updatedWallet = await db.wallet.update({
        where: { userId: user.id },
        data: {
          balance: {
            decrement: BigInt(Math.floor(amount)),
          },
        },
      });

      // Create ledger entry
      await db.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: 'BET',
          amount: BigInt(Math.floor(amount)),
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance - BigInt(Math.floor(amount)),
          source: 'wallet_update',
          reference: reference || undefined,
          status: 'COMPLETED',
        },
      });

      return NextResponse.json({
        success: true,
        wallet: {
          id: updatedWallet.id,
          balance: Number(updatedWallet.balance),
          sofBalance: Number(updatedWallet.sofBalance),
          usdBalance: Number(updatedWallet.usdBalance),
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
