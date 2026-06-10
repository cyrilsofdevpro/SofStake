import { NextResponse, NextRequest } from 'next/server';
import { getTokenPairs } from '@/lib/dexscreener';

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

    const pairs = await getTokenPairs(address);
    return NextResponse.json({
      success: true,
      data: pairs,
      count: pairs.length,
      address,
      timestamp: new Date().toISOString(),
    });
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
