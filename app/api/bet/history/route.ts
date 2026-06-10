import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/protected-route';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = withAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    const where: any = { userId: user.id };
    if (status) {
      where.status = status;
    }

    const [bets, total] = await Promise.all([
      db.cryptoBet.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.cryptoBet.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: bets.map((bet) => ({
        id: bet.id,
        pairAddress: bet.pairAddress,
        direction: bet.direction,
        stake: bet.stake,
        windowMinutes: bet.windowMinutes,
        entryPrice: bet.entryPrice,
        resultPrice: bet.resultPrice,
        currentPrice: bet.currentPrice,
        payout: bet.payout,
        status: bet.status,
        outcome: bet.outcome,
        createdAt: bet.createdAt.toISOString(),
        resolveAt: bet.resolveAt.toISOString(),
        resolvedAt: bet.resolvedAt?.toISOString() || null,
      })),
      total,
      limit,
      skip,
    });
  } catch (error) {
    console.error('Error fetching bet history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch bet history' },
      { status: 500 }
    );
  }
}
