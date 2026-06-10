import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/protected-route';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = withAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wallet = await db.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      // Create default wallet if it doesn't exist
      const newWallet = await db.wallet.create({
        data: {
          userId: user.id,
          balance: 1000, // Starting balance
          sofBalance: 1000,
        },
      });

      return NextResponse.json({
        success: true,
        wallet: {
          id: newWallet.id,
          userId: newWallet.userId,
          balance: Number(newWallet.balance),
          lockedBalance: Number(newWallet.lockedBalance),
          sofBalance: Number(newWallet.sofBalance),
          usdBalance: Number(newWallet.usdBalance),
        },
      });
    }

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        userId: wallet.userId,
        balance: Number(wallet.balance),
        lockedBalance: Number(wallet.lockedBalance),
        sofBalance: Number(wallet.sofBalance),
        usdBalance: Number(wallet.usdBalance),
      },
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch wallet balance' },
      { status: 500 }
    );
  }
}
