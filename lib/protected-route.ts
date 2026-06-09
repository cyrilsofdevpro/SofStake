import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './auth';

/**
 * Verify JWT token from request and return user payload
 * Returns user payload if valid, null if invalid
 */
export function verifyRequestToken(request: NextRequest): JWTPayload | null {
  const token = request.cookies.get('authToken')?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Wrapper for protecting API routes with JWT
 * Usage:
 * export async function POST(request: NextRequest) {
 *   const user = withAuth(request);
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // Your protected route logic here
 * }
 */
export function withAuth(request: NextRequest): JWTPayload | null {
  return verifyRequestToken(request);
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}
