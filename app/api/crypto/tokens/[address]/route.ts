import { NextResponse, NextRequest } from 'next/server';
import { fetchWithProxy } from '@/lib/dexscreenerProxy';
import { normalizePairs } from '@/lib/dexscreener';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!address || address.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token address is required',
          data: [],
        },
        { status: 400 }
      );
    }

    try {
      const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(address)}`;
      const json = await fetchWithProxy(url, 20_000, 2).catch((e) => {
        // eslint-disable-next-line no-console
        console.error('DexScreener token fetch error:', e);
        return null;
      });

      const pairs = normalizePairs(json?.pairs ?? []).slice(0, 15);
      return NextResponse.json({
        success: true,
        data: pairs,
        count: pairs.length,
        address,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Token pairs route error:', err);
      return NextResponse.json({ success: true, data: [], count: 0, address, timestamp: new Date().toISOString() });
    }
  } catch (error) {
    console.error('Error fetching token pairs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch token pairs',
        data: [],
      },
      { status: 500 }
    );
  }
}
