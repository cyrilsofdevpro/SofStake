import { NextResponse } from 'next/server';
import { fetchWithProxy } from '@/lib/dexscreenerProxy';

type NormalizedToken = {
  name: string;
  symbol: string;
  priceUsd: number;
  liquidityUsd: number;
  volume24h: number;
  priceChange24h: number;
  dex: string;
  pairAddress: string;
  chainId?: string;
  url?: string;
};

function normalizePairs(pairs: any[] = []): NormalizedToken[] {
  return (pairs || [])
    .filter((p) => p && (p.pairAddress || p.address))
    .map((pair) => {
      const base = pair.baseToken || pair.token || {};
      const quote = pair.quoteToken || {};
      return {
        name: String(base.name ?? quote.name ?? pair.name ?? 'Unknown'),
        symbol: String(base.symbol ?? quote.symbol ?? pair.symbol ?? 'N/A'),
        priceUsd: Number(pair.priceUsd ?? pair.price ?? 0) || 0,
        liquidityUsd: Number(pair.liquidity?.usd ?? pair.liquidityUsd ?? 0) || 0,
        volume24h: Number(pair.volume?.h24 ?? pair.volume24h ?? 0) || 0,
        priceChange24h: Number(pair.priceChange?.h24 ?? pair.priceChange24h ?? 0) || 0,
        dex: String(pair.dexId ?? pair.dex ?? 'dexscreener'),
        pairAddress: String(pair.pairAddress ?? pair.address ?? ''),
        chainId: String(pair.chainId ?? ''),
        url: String(pair.url ?? ''),
      } as NormalizedToken;
    })
    .filter((t) => t.pairAddress);
}

const FALLBACK: NormalizedToken[] = [
  { name: 'Bitcoin', symbol: 'BTC', priceUsd: 0, liquidityUsd: 0, volume24h: 0, priceChange24h: 0, dex: 'fallback', pairAddress: 'fallback:BTC', chainId: '1', url: '' },
  { name: 'Ethereum', symbol: 'ETH', priceUsd: 0, liquidityUsd: 0, volume24h: 0, priceChange24h: 0, dex: 'fallback', pairAddress: 'fallback:ETH', chainId: '1', url: '' },
  { name: 'Tether', symbol: 'USDT', priceUsd: 0, liquidityUsd: 0, volume24h: 0, priceChange24h: 0, dex: 'fallback', pairAddress: 'fallback:USDT', chainId: '1', url: '' },
  { name: 'BNB', symbol: 'BNB', priceUsd: 0, liquidityUsd: 0, volume24h: 0, priceChange24h: 0, dex: 'fallback', pairAddress: 'fallback:BNB', chainId: '56', url: '' },
  { name: 'Cardano', symbol: 'ADA', priceUsd: 0, liquidityUsd: 0, volume24h: 0, priceChange24h: 0, dex: 'fallback', pairAddress: 'fallback:ADA', chainId: '1', url: '' },
];

export async function GET() {
  try {
    // Use proxy to request DexScreener trending (server-side only)
    const url = 'https://api.dexscreener.com/latest/dex/trending';
    let json: any = null;
    try {
      json = await fetchWithProxy(url, 20_000, 2);
    } catch (err) {
      // log and fall through to fallback
      // eslint-disable-next-line no-console
      console.error('DexScreener trending error:', err);
    }

    const tokens = normalizePairs(json?.pairs ?? []);
    const dataToReturn = tokens.length > 0 ? tokens.slice(0, 10) : FALLBACK;

    return NextResponse.json({
      success: true,
      data: dataToReturn,
      count: dataToReturn.length,
      timestamp: new Date().toISOString(),
      source: tokens.length > 0 ? 'dexscreener' : 'fallback',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in trending route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
