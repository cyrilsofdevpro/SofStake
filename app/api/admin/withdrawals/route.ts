import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Basic admin endpoints to list and change withdrawal status.

export async function GET(request: NextRequest) {
  try {
    const status = String(request.nextUrl.searchParams.get('status') || 'PENDING');
    const items = await prisma.withdrawalRequest.findMany({ where: { status }, include: { user: true } });
    return NextResponse.json(items);
  } catch (e) {
    console.error('GET /api/admin/withdrawals', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, requestId, adminId } = body as { action?: string; requestId?: string; adminId?: string };
    if (!action || !requestId) return NextResponse.json({ error: 'action and requestId required' }, { status: 400 });

    const wr = await prisma.withdrawalRequest.findUnique({ where: { id: requestId } });
    if (!wr) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (action === 'approve') {
      // mark approved and move status to APPROVED -> then admin should trigger payout and mark PAID
      const updated = await prisma.withdrawalRequest.update({ where: { id: requestId }, data: { status: 'APPROVED', adminId, processedAt: new Date() } });
      return NextResponse.json({ message: 'Approved', updated });
    }

    if (action === 'reject') {
      // refund SofCoin back to wallet and mark rejected
      const updated = await prisma.withdrawalRequest.update({ where: { id: requestId }, data: { status: 'REJECTED', adminId, processedAt: new Date() } });

      // refund
      const wallet = await prisma.wallet.findUnique({ where: { userId: wr.userId } });
      if (wallet) {
        await prisma.$transaction([
          prisma.wallet.update({ where: { id: wallet.id }, data: { sofBalance: { increment: wr.amountSof } } as any }),
          prisma.ledgerEntry.create({ data: { walletId: wallet.id, type: 'refund', amount: wr.amountSof, currency: 'SOF', balanceBefore: wallet.sofBalance, balanceAfter: wallet.sofBalance.add(wr.amountSof), source: 'withdraw_reject', reference: `refund_${Date.now()}` } }),
        ]);
      }

      return NextResponse.json({ message: 'Rejected and refunded', updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('POST /api/admin/withdrawals', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
