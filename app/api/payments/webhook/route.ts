import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Mock payment provider webhook: expects {reference, userId, amountUsd}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, userId, amountUsd } = body as { reference?: string; userId?: string; amountUsd?: number };
    if (!reference || !userId || typeof amountUsd !== 'number') return NextResponse.json({ error: 'invalid payload' }, { status: 400 });

    // Find wallet or create
    const wallet = await prisma.wallet.upsert({ where: { userId }, create: { userId, sofBalance: 0, usdBalance: 0 }, update: {} });

    const sof = amountUsd * 200;

    await prisma.$transaction([
      prisma.wallet.update({ where: { id: wallet.id }, data: { sofBalance: { increment: sof }, usdBalance: { increment: amountUsd } } as any }),
      prisma.ledgerEntry.create({ data: { walletId: wallet.id, type: 'deposit', amount: sof, currency: 'SOF', balanceBefore: Number(wallet.sofBalance ?? 0), balanceAfter: Number(wallet.sofBalance ?? 0) + sof, source: 'card_webhook', reference, metadata: JSON.stringify({ amountUsd }) } }),
      prisma.walletTransaction.create({ data: { userId, type: 'deposit', amount: sof, status: 'completed', reference, metadata: JSON.stringify({ amountUsd }) } }),
    ]);

    return NextResponse.json({ message: 'ok' });
  } catch (e) {
    console.error('payment webhook error', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
