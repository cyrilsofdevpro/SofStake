import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const STAKE_RATES: Record<number, number> = {
  7: 0.025,
  30: 0.05,
  90: 0.12,
};

function calculateReward(amount: number, periodDays: number) {
  const rate = STAKE_RATES[periodDays] ?? 0.03;
  return Number((amount * rate).toFixed(2));
}

export async function GET(request: NextRequest) {
  const userId = String(request.nextUrl.searchParams.get('userId') || '');
  if (!userId) {
    return NextResponse.json({ error: 'userId query is required' }, { status: 400 });
  }

  try {
    const stakes = await prisma.staking.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(stakes);
  } catch (error) {
    console.error('GET /api/staking error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, amount, periodDays, stakeId } = body as any;
    if (!action || !userId) {
      return NextResponse.json({ error: 'action and userId are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, sofBalance: user.walletBalance ?? 0, usdBalance: 0 },
    });

    if (action === 'stake') {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
      }
      if (!Number.isFinite(amount)) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
      }
      if (typeof periodDays !== 'number' || ![7, 30, 90].includes(periodDays)) {
        return NextResponse.json({ error: 'periodDays must be one of 7, 30, or 90' }, { status: 400 });
      }
      if (wallet.sofBalance < amount) {
        return NextResponse.json({ error: 'Insufficient SofCoin balance', status: 402 }, { status: 402 });
      }

      const reward = calculateReward(amount, periodDays);
      const payoutAmount = Number((amount + reward).toFixed(2));
      const startAt = new Date();
      const endAt = new Date(startAt.getTime() + periodDays * 24 * 60 * 60 * 1000);
      const stakePlan = `${periodDays}-day`;

      const staking = await prisma.$transaction(async (tx) => {
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { sofBalance: { decrement: amount } },
        });

        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { decrement: amount } },
        });

        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: 'stake_lock',
            amount: -amount,
            currency: 'SOF',
            balanceAfter: Number(updatedWallet.sofBalance.toFixed(2)),
            source: 'staking',
            reference: `staking_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            metadata: JSON.stringify({ periodDays, reward, stakePlan }),
          },
        });

        await tx.walletTransaction.create({
          data: {
            userId,
            type: 'stake',
            amount: -amount,
            status: 'completed',
            metadata: JSON.stringify({ periodDays, stakePlan, reward }),
          },
        });

        return tx.staking.create({
          data: {
            userId,
            amount,
            periodDays,
            stakePlan,
            startAt,
            endAt,
            reward,
            payoutAmount,
            status: 'active',
          },
        });
      });

      return NextResponse.json({ success: true, staking, walletBalance: wallet.sofBalance - amount });
    }

    if (action === 'unstake') {
      if (!stakeId) {
        return NextResponse.json({ error: 'stakeId is required for unstake' }, { status: 400 });
      }

      const stake = await prisma.staking.findUnique({ where: { id: stakeId } });
      if (!stake) {
        return NextResponse.json({ error: 'Stake not found' }, { status: 404 });
      }
      if (stake.userId !== userId) {
        return NextResponse.json({ error: 'Stake does not belong to user' }, { status: 403 });
      }
      if (stake.status !== 'active') {
        return NextResponse.json({ error: 'Stake is not active' }, { status: 400 });
      }

      const now = new Date();
      const isMature = now >= stake.endAt;
      const penaltyRate = isMature ? 0 : 0.1;
      const penaltyAmount = Number((stake.amount * penaltyRate).toFixed(2));
      const rewardAward = isMature ? stake.reward : 0;
      const releaseAmount = Number((stake.amount + rewardAward - penaltyAmount).toFixed(2));
      const status = isMature ? 'completed' : 'cancelled';

      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { sofBalance: { increment: releaseAmount } },
        });

        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: releaseAmount } },
        });

        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: isMature ? 'stake_release' : 'stake_early_release',
            amount: releaseAmount,
            currency: 'SOF',
            balanceAfter: Number((wallet.sofBalance + releaseAmount).toFixed(2)),
            source: 'staking',
            reference: `unstake_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            metadata: JSON.stringify({ stakeId, penaltyAmount, rewardAward, status }),
          },
        });

        await tx.walletTransaction.create({
          data: {
            userId,
            type: 'stake_payout',
            amount: releaseAmount,
            status: 'completed',
            metadata: JSON.stringify({ stakeId, isMature, penaltyAmount, rewardAward }),
          },
        });

        await tx.staking.update({
          where: { id: stakeId },
          data: {
            status,
            penaltyApplied: penaltyRate > 0,
            claimedAt: now,
          },
        });
      });

      return NextResponse.json({ success: true, releaseAmount, rewardAward, penaltyAmount, isMature });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/staking error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
