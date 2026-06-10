import { NextResponse } from 'next/server';
import { fetchTrendingTokens } from '@/lib/dexscreener';

export async function GET() {
  try {
    const tokens = await fetchTrendingTokens();
    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length,
      timestamp: new Date().toISOString(),
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
