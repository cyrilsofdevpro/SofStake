import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const SOF_PER_USD = 200; // 1 USD = 200 SofCoin (1 SofCoin = $0.005)

export async function GET(request: NextRequest) {
  try {
    const userId = String(request.nextUrl.searchParams.get('userId') || '');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return NextResponse.json({ sofBalance: 0, usdBalance: 0 });

    return NextResponse.json({
      sofBalance: Number(wallet.sofBalance ?? 0),
      usdBalance: Number(wallet.usdBalance ?? 0),
    });
  } catch (e) {
    console.error('GET /api/wallet error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body as { action?: string; userId?: string };

    if (!action || !userId) {
      return NextResponse.json({ error: 'action and userId are required' }, { status: 400 });
    }

    // Ensure wallet exists
    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, sofBalance: 0, usdBalance: 0 },
    });

    if (action === 'buy') {
      const { amountUsd, amountNgN, amountSof } = body as any;

      let usd = 0;
      let sof = 0;
      if (typeof amountSof === 'number' && amountSof > 0) {
        sof = amountSof;
        usd = sof / SOF_PER_USD;
      } else if (typeof amountUsd === 'number' && amountUsd > 0) {
        usd = amountUsd;
        sof = usd * SOF_PER_USD;
      } else if (typeof amountNgN === 'number' && amountNgN > 0) {
        // NGN flow: expect frontend to convert to USD first; fallback: reject
        return NextResponse.json({ error: 'NGN purchase not supported server-side yet' }, { status: 422 });
      } else {
        return NextResponse.json({ error: 'amountUsd or amountSof required' }, { status: 400 });
      }

      // Update balances and ledger
      const newSofBalance = Number(wallet.sofBalance ?? 0) + sof;
      const newUsdBalance = Number(wallet.usdBalance ?? 0) + usd;

      await prisma.$transaction([
        prisma.wallet.update({ where: { id: wallet.id }, data: { sofBalance: newSofBalance, usdBalance: newUsdBalance } }),
        prisma.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: 'deposit',
            amount: sof,
            currency: 'SOF',
            balanceBefore: Number(wallet.sofBalance ?? 0),
            balanceAfter: newSofBalance,
            source: 'card',
            reference: `buy_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
            metadata: JSON.stringify({ usd }),
          },
        }),
        prisma.walletTransaction.create({
          data: {
            userId,
            type: 'deposit',
            amount: sof,
            status: 'completed',
            reference: `tx_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
            metadata: JSON.stringify({ usd }),
          },
        }),
      ]);

      return NextResponse.json({ message: 'Purchase completed', sof, usd, sofBalance: newSofBalance });
    }

    if (action === 'withdraw') {
      const { amountSof } = body as any;
      if (typeof amountSof !== 'number' || amountSof <= 0) {
        return NextResponse.json({ error: 'amountSof required' }, { status: 400 });
      }

      if (Number(wallet.sofBalance ?? 0) < amountSof) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 402 });
      }

      const usd = amountSof / SOF_PER_USD;

      // Create withdrawal request (admin approval required for processing)
      const wr = await prisma.withdrawalRequest.create({
        data: {
          userId,
          amountSof,
          amountUsd: usd,
          status: 'PENDING',
          reference: `wd_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        },
      });

      // Mark transaction as pending and deduct soft-reserve (optimistic hold)
      await prisma.$transaction([
        prisma.wallet.update({ where: { id: wallet.id }, data: { sofBalance: Number(wallet.sofBalance ?? 0) - amountSof } }),
        prisma.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: 'withdraw_request',
            amount: -amountSof,
            currency: 'SOF',
            balanceBefore: Number(wallet.sofBalance ?? 0),
            balanceAfter: Number(wallet.sofBalance ?? 0) - amountSof,
            source: 'withdraw_request',
            reference: wr.reference,
          },
        }),
        prisma.walletTransaction.create({
          data: {
            userId,
            type: 'withdraw',
            amount: -amountSof,
            status: 'pending',
            reference: wr.reference,
          },
        }),
      ]);

      return NextResponse.json({ message: 'Withdrawal requested', requestId: wr.id });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('POST /api/wallet error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
