import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

function getAuthMeErrorResponse(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    return NextResponse.json(
      { error: 'Database unavailable. Please try again later.' },
      { status: 503 }
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Can\'t reach database server') || message.includes('Database connection')) {
    return NextResponse.json(
      { error: 'Database unavailable. Please try again later.' },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: 'An error occurred' },
    { status: 500 }
  );
}

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('authToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Auth check error:', error);
    return getAuthMeErrorResponse(error);
  }
}
