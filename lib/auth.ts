import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
const TOKEN_EXPIRY = '30d';
export const AUTH_COOKIE_NAME = 'authToken';
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60,
  path: '/',
};

/**
 * Ensure JWT secret is set
 */
function getJWTSecret(): string {
  if (!JWT_SECRET) {
    throw new Error(
      'JWT_SECRET environment variable is not set. Add it to your .env.local file.'
    );
  }
  return JWT_SECRET;
}

export interface JWTPayload {
  id: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, getJWTSecret(), { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJWTSecret()) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Get token from cookies
 */
export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return token || null;
}

/**
 * Get current user from token
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Set auth token in cookies
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
}

/**
 * Clear auth cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, '', {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
}

export const authOptions = {};
