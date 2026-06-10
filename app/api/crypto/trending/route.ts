import { NextResponse } from 'next/server';
import { fetchTrendingTokens } from '@/lib/dexscreener';

export async function GET() {
  try {
    const tokens = await fetchTrendingTokens();
    const fallback = [
      { name: 'Bitcoin', symbol: 'BTC', priceUsd: 0, liquidityUsd: 0, volume24h: 0, priceChange24h: 0, dex: 'fallback', pairAddress: 'fallback:BTC', url: '', chainId: '1' },
      { name: 'Ethereum', symbol: 'ETH', priceUsd: 0, liquidityUsd: 0, volume24h: 0, priceChange24h: 0, dex: 'fallback', pairAddress: 'fallback:ETH', url: '', chainId: '1' },
      { name: 'Tether', symbol: 'USDT', priceUsd: 0, liquidityUsd: 0, volume24h: 0, priceChange24h: 0, dex: 'fallback', pairAddress: 'fallback:USDT', url: '', chainId: '1' },
      { name: 'BNB', symbol: 'BNB', priceUsd: 0, liquidityUsd: 0, volume24h: 0, priceChange24h: 0, dex: 'fallback', pairAddress: 'fallback:BNB', url: '', chainId: '56' },
      { name: 'Cardano', symbol: 'ADA', priceUsd: 0, liquidityUsd: 0, volume24h: 0, priceChange24h: 0, dex: 'fallback', pairAddress: 'fallback:ADA', url: '', chainId: '1' },
    ];

    const dataToReturn = (tokens && tokens.length > 0) ? tokens : fallback;

    return NextResponse.json({
      success: true,
      data: dataToReturn,
      count: dataToReturn.length,
      timestamp: new Date().toISOString(),
      source: tokens && tokens.length > 0 ? 'dexscreener' : 'fallback',
    });
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch trending tokens',
      },
      { status: 500 }
    );
  }
}
