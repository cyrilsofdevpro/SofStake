import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { rateLimit, checkIpAbuse, logEvent } from '@/lib/antiAbuse';

// Mining rules
const WEEKLY_CAP = 20; // max SofCoin per 7 days

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, deviceFingerprint } = body as { userId?: string; deviceFingerprint?: string };
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 });

    const now = new Date();

    // IP and rate limit checks
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
    const rateKey = `mining_attempt_${ip ?? userId}`;
    if (!rateLimit(rateKey, 10, 60 * 1000)) { // 10 attempts per minute
      await logEvent('rate_limited', userId, ip, { reason: 'attempts_per_minute' });
      return NextResponse.json({ error: 'Too many attempts, slow down' }, { status: 429 });
    }

    const ipAbuse = await checkIpAbuse(ip);
    if (ipAbuse) {
      await logEvent('ip_abuse_block', userId, ip, { reason: 'ip_threshold' });
      return NextResponse.json({ error: 'IP has exceeded allowed claims' }, { status: 429 });
    }

    // Check last claim (24h cooldown)
    if (user.lastBonusClaim) {
      const last = new Date(user.lastBonusClaim);
      const diffMs = now.getTime() - last.getTime();
      if (diffMs < 1000 * 60 * 60 * 24) {
        return NextResponse.json({ error: 'Cooldown: already claimed within 24 hours' }, { status: 400 });
      }
    }

    // Device fingerprint abuse check: any claim from same device within 24h
    if (deviceFingerprint) {
      const recent = await prisma.miningClaim.findFirst({ where: { deviceFingerprint, userId }, orderBy: { claimedAt: 'desc' } });
      if (recent) {
        const diffMs = now.getTime() - new Date(recent.claimedAt).getTime();
        if (diffMs < 1000 * 60 * 60 * 24) {
          await logEvent('device_block', userId, ip, { deviceFingerprint });
          return NextResponse.json({ error: 'This device has already claimed within 24 hours' }, { status: 400 });
        }
      }
    }

    // Determine streak
    let streak = user.loginStreak || 0;
    if (user.lastBonusClaim) {
      const last = new Date(user.lastBonusClaim);
      const daysSince = Math.floor((now.setHours(0,0,0,0) - new Date(last).setHours(0,0,0,0)) / (1000*60*60*24));
      if (daysSince === 1) streak = streak + 1;
      else streak = 1;
    } else {
      streak = 1;
    }

    // Compute reward
    let reward = 2; // default day 1
    if (streak === 1) reward = 2;
    else if (streak >= 2 && streak <= 6) reward = randInt(2,3);
    else if (streak >= 7) reward = randInt(10,20);

    // Enforce weekly cap
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentClaims = await prisma.miningClaim.findMany({ where: { userId, claimedAt: { gte: weekAgo } } });
    const weeklyTotal = recentClaims.reduce((s, c) => s + (c.amountSof || 0), 0);
    if (weeklyTotal >= WEEKLY_CAP) {
      await logEvent('weekly_cap_reached', userId, ip, { weeklyTotal });
      return NextResponse.json({ error: 'Weekly mining cap reached' }, { status: 400 });
    }

    const remaining = WEEKLY_CAP - weeklyTotal;
    if (reward > remaining) reward = remaining; // cap reward
    if (reward <= 0) return NextResponse.json({ error: 'No mining allowance left this week' }, { status: 400 });

    // Upsert wallet
    const wallet = await prisma.wallet.upsert({ where: { userId }, update: {}, create: { userId, sofBalance: 0, usdBalance: 0 } });

    // Apply credit and create ledger + walletTransaction + miningClaim
    await prisma.$transaction([
      prisma.wallet.update({ where: { id: wallet.id }, data: { sofBalance: { increment: reward } } }),
      prisma.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: 'mining',
          amount: reward,
          currency: 'SOF',
          balanceAfter: (wallet.sofBalance ?? 0) + reward,
          source: 'daily_mining',
          metadata: JSON.stringify({ streak }),
          reference: `mining_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        },
      }),
      prisma.walletTransaction.create({
        data: {
          userId,
          type: 'daily_bonus',
          amount: reward,
          status: 'completed',
          metadata: JSON.stringify({ streak }),
        },
      }),
      prisma.miningClaim.create({ data: { userId, amountSof: reward, streakDay: streak, deviceFingerprint: deviceFingerprint || null } }),
      prisma.user.update({
        where: { id: userId },
        data: { lastBonusClaim: new Date(), loginStreak: streak, totalBonusEarnings: { increment: reward } },
      }),
    ]);

    return NextResponse.json({ success: true, amount: reward, streak });
  } catch (e) {
    console.error('Mining claim error', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      { error: 'internal', detail: process.env.NODE_ENV !== 'production' ? message : undefined },
      { status: 500 }
    );
  }
}
