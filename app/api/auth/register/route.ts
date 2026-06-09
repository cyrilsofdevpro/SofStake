import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';

function getRegisterErrorResponse(error: unknown) {
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
    { error: 'An error occurred during registration' },
    { status: 500 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, name } = await request.json();

    // Validate input
    if (!email || !password || !username || !name) {
      return NextResponse.json(
        { error: 'Email, password, username, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if username is taken
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        username,
        name,
      },
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username || user.email.split('@')[0],
    });

    // Create response
    const response = NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username || user.email.split('@')[0],
          name: user.name,
        },
      },
      { status: 201 }
    );

    // Set cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return getRegisterErrorResponse(error);
  }
}
