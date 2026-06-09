import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!PAYSTACK_SECRET_KEY) {
    return errorResponse('Missing Paystack secret key.', 500);
  }

  let payload: { amount?: number; email?: string; userId?: string };
  try {
    payload = await request.json();
  } catch (error) {
    return errorResponse('Invalid request body.', 400);
  }

  const { amount, email, userId } = payload;
  if (!amount || !email || !userId) {
    return errorResponse('Amount, email and userId are required.', 400);
  }

  const reference = `SofStake-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const callbackUrl = `${request.headers.get('origin') || ''}/wallet`;

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      reference,
      callback_url: callbackUrl,
      metadata: { userId, email }
    })
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    return errorResponse(data.message || 'Paystack initialization failed.', response.status);
  }

  // Try to store pending transaction (non-critical if it fails)
  try {
    await prisma.walletTransaction.create({
      data: {
        userId,
        type: 'deposit',
        amount,
        status: 'pending',
        reference,
        metadata: JSON.stringify({ userId, email })
      }
    });
  } catch (dbError: any) {
    // Foreign key error or other DB issue - log but don't fail the Paystack init
    // Webhook will handle creating the record when payment completes
    console.warn('Could not store pending transaction:', dbError.message);
  }

  return NextResponse.json(data);
}

export async function GET(request: Request) {
  if (!PAYSTACK_SECRET_KEY) {
    return errorResponse('Missing Paystack secret key.', 500);
  }

  const url = new URL(request.url);
  const reference = url.searchParams.get('reference');
  if (!reference) {
    return errorResponse('Missing reference query parameter.', 400);
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
    }
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    return errorResponse(data.message || 'Paystack verification failed.', response.status);
  }

  const payment = data.data;
  const amount = typeof payment.amount === 'number' ? Number(payment.amount) / 100 : undefined;
  const metadata = typeof payment.metadata === 'string'
    ? JSON.parse(payment.metadata)
    : payment.metadata || {};
  const userId = metadata?.userId;
  const email = metadata?.email;

  if (!amount || !userId) {
    return errorResponse('Unable to verify payment metadata.', 400);
  }

  // Try to update or create transaction record
  try {
    const existing = await prisma.walletTransaction.findUnique({ where: { reference } });

    if (!existing && payment.status === 'success') {
      await prisma.walletTransaction.create({
        data: {
          userId,
          type: 'deposit',
          amount,
          status: 'completed',
          reference,
          metadata: JSON.stringify({ userId, email })
        }
      });
    } else if (existing && existing.status !== 'completed' && payment.status === 'success') {
      await prisma.walletTransaction.update({
        where: { reference },
        data: { status: 'completed', amount }
      });
    }

    // Update user wallet balance if payment succeeded
    if (payment.status === 'success') {
      await prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: amount } }
      });
    }
  } catch (dbError: any) {
    // Log but don't fail - return verification to caller
    console.warn('Could not update transaction record:', dbError.message);
  }

  return NextResponse.json(data);
}
