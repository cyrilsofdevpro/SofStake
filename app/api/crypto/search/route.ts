import { NextResponse, NextRequest } from 'next/server';
import { fetchWithProxy } from '@/lib/dexscreenerProxy';
import { normalizePairs } from '@/lib/dexscreener';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query is required',
          data: [],
        },
        { status: 400 }
      );
    }

    try {
      const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`;
      const json = await fetchWithProxy(url, 20_000, 2).catch((e) => {
        // log and fallthrough to empty
        // eslint-disable-next-line no-console
        console.error('DexScreener search error:', e);
        return null;
      });

      const normalized = normalizePairs(json?.pairs ?? []);
      const unique = new Map<string, any>();
      normalized.forEach((item) => {
        if (!unique.has(item.pairAddress)) unique.set(item.pairAddress, item);
      });

      const results = Array.from(unique.values()).slice(0, 20);

      return NextResponse.json({
        success: true,
        data: results,
        count: results.length,
        query,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Search route error:', err);
      return NextResponse.json({ success: true, data: [], count: 0, query, timestamp: new Date().toISOString() });
    }
  } catch (error) {
    console.error('Error searching tokens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search tokens',
        data: [],
      },
      { status: 500 }
    );
  }
}
