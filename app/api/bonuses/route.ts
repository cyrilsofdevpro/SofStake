import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const user = (await prisma.user.findUnique({
      where: { id: userId },
    })) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (user.lastBonusClaim) {
      const lastClaim = new Date(user.lastBonusClaim);
      lastClaim.setHours(0, 0, 0, 0);
      
      if (lastClaim.getTime() === today.getTime()) {
        return NextResponse.json(
          { error: 'Already claimed today', success: false },
          { status: 400 }
        );
      }
    }

    // Calculate streak and bonus amount
    let streak = user.loginStreak || 0;
    let bonusAmount = 50; // Base amount

    if (user.lastBonusClaim) {
      const lastClaim = new Date(user.lastBonusClaim);
      const daysSinceLastClaim = Math.floor(
        (today.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastClaim === 1) {
        streak++;
      } else if (daysSinceLastClaim > 1) {
        streak = 1;
      }
    } else {
      streak = 1;
    }

    // Apply streak multipliers
    if (streak >= 7) {
      bonusAmount = 200;
    } else if (streak >= 3) {
      bonusAmount = 100;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: user.walletBalance + bonusAmount,
        lastBonusClaim: new Date(),
        loginStreak: streak,
        totalBonusEarnings: user.totalBonusEarnings + bonusAmount,
      },
    });

    // Create transaction
    const transactionType = streak >= 3 ? 'win' : 'deposit';

    await prisma.walletTransaction.create({
      data: {
        userId,
        type: transactionType,
        amount: bonusAmount,
        status: 'completed',
        reference: null,
        metadata: {},
      },
    });

    return NextResponse.json({
      success: true,
      amount: bonusAmount,
      streak,
    });
  } catch (error) {
    console.error('Bonus claim error:', error);
    return NextResponse.json(
      { error: 'Failed to claim bonus' },
      { status: 500 }
    );
  }
}
