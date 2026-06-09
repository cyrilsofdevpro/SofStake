import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const prismaAny = prisma as any;

export async function GET() {
  try {
    const events = await prismaAny.analyticsEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    return NextResponse.json(events);
  } catch (e) {
    console.error('analytics list error', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
