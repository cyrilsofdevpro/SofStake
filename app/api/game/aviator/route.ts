import { NextRequest, NextResponse } from 'next/server';

type AviatorBet = {
  userId: string;
  stake: number;
  cashOutAt: number | null;
};

type AviatorRound = {
  id: string;
  crashPoint: number;
  bets: AviatorBet[];
};

// In-memory storage for current round
let currentRound: AviatorRound | null = null;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, userId, stake, cashOutAt } = body;

  if (action === 'start-round') {
    // Generate new crash point
    currentRound = {
      id: crypto.randomUUID(),
      crashPoint: Math.floor(Math.random() * 980) / 100 + 1.01,
      bets: []
    };
    return NextResponse.json({ roundId: currentRound.id, crashPoint: currentRound.crashPoint });
  }

  if (action === 'place-bet') {
    if (!currentRound) {
      return NextResponse.json({ error: 'No active round' }, { status: 400 });
    }

    currentRound.bets.push({
      userId,
      stake,
      cashOutAt: null
    });

    return NextResponse.json({ success: true, roundId: currentRound.id });
  }

  if (action === 'cash-out') {
    if (!currentRound) {
      return NextResponse.json({ error: 'No active round' }, { status: 400 });
    }

    const bet = currentRound.bets.find(b => b.userId === userId);
    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    bet.cashOutAt = cashOutAt;

    const fee = 0.1;
    const payout = Math.round(bet.stake * cashOutAt * (1 - fee));

    return NextResponse.json({ success: true, payout, multiplier: cashOutAt });
  }

  if (action === 'end-round') {
    if (!currentRound) {
      return NextResponse.json({ error: 'No active round' }, { status: 400 });
    }

    const results = currentRound.bets.map(bet => {
      if (bet.cashOutAt && bet.cashOutAt < currentRound!.crashPoint) {
        const fee = 0.1;
        const payout = Math.round(bet.stake * bet.cashOutAt * (1 - fee));
        return {
          userId: bet.userId,
          status: 'won',
          cashOutAt: bet.cashOutAt,
          payout
        };
      } else {
        return {
          userId: bet.userId,
          status: 'lost',
          cashOutAt: null,
          payout: 0
        };
      }
    });

    const roundId = currentRound.id;
    const crashPoint = currentRound.crashPoint;
    currentRound = null;

    return NextResponse.json({ success: true, results, crashPoint });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  if (currentRound) {
    return NextResponse.json({
      roundId: currentRound.id,
      crashPoint: currentRound.crashPoint,
      betCount: currentRound.bets.length
    });
  }

  return NextResponse.json({ roundId: null, crashPoint: null });
}
