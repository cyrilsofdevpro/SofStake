import { NextRequest, NextResponse } from 'next/server';
// Middleware temporarily disabled - causing 500 errors
// Will re-enable after fixing auth endpoints

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Disabled for now
  ],
};
