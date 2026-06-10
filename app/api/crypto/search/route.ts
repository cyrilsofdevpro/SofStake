import { NextResponse, NextRequest } from 'next/server';
import { searchTokens } from '@/lib/dexscreener';

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

    const tokens = await searchTokens(query);
    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length,
      query,
      timestamp: new Date().toISOString(),
    });
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
