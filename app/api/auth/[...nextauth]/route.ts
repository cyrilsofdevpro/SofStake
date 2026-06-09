import { NextResponse } from 'next/server';

/**
 * NextAuth is no longer used. Use JWT authentication instead:
 * - POST /api/auth/login
 * - POST /api/auth/register
 * - POST /api/auth/logout
 * - GET /api/auth/me
 */

export async function GET() {
  return NextResponse.json(
    { error: 'NextAuth is no longer used. Please use JWT authentication.' },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'NextAuth is no longer used. Please use JWT authentication.' },
    { status: 404 }
  );
}
