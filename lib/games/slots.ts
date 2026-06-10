export interface SlotSpinRequest {
  userId: string;
  betAmount: number;
}

export interface SlotWinLine {
  line: number[];
  symbol: string;
  symbolId: string;
  count: number;
  multiplier: number;
  payout: number;
}

export interface SlotSpinResponse {
  roundId: string;
  grid: string[][];
  wins: SlotWinLine[];
  payout: number;
  multiplier: number;
  newBalance: number;
}

export async function spinSlot(request: SlotSpinRequest): Promise<SlotSpinResponse> {
  const response = await fetch('/api/games/slots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Slot spin failed');
  }

  return data.data;
}
