import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Game API is not active yet' }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ error: 'Game API is not active yet' }, { status: 501 });
}
