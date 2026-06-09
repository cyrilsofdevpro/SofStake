import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!PAYSTACK_SECRET_KEY) {
    return errorResponse('Missing Paystack secret key.', 500);
  }

  const signature = request.headers.get('x-paystack-signature') || '';
  const bodyText = await request.text();
  const computed = createHmac('sha512', PAYSTACK_SECRET_KEY).update(bodyText).digest('hex');

  if (!signature || signature.length !== computed.length) {
    return errorResponse('Invalid Paystack signature.', 400);
  }

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const computedBuffer = Buffer.from(computed, 'utf8');

  if (!timingSafeEqual(signatureBuffer, computedBuffer)) {
    return errorResponse('Invalid Paystack signature.', 400);
  }

  let payload: any;
  try {
    payload = JSON.parse(bodyText);
  } catch (error) {
    return errorResponse('Invalid webhook payload.', 400);
  }

  const event = payload.event;
  const data = payload.data;
  const reference = data?.reference;
  const metadata = typeof data?.metadata === 'string' ? JSON.parse(data.metadata) : data?.metadata || {};
  const email = metadata?.email;
  const userId = metadata?.userId;

  if (!reference) {
    return errorResponse('Missing transaction reference.', 400);
  }

  if (event === 'charge.success' || event === 'charge.completed') {
    const transaction = await prisma.walletTransaction.findUnique({ where: { reference } });
    let user = null;

    if (transaction) {
      user = await prisma.user.findUnique({ where: { id: transaction.userId } });
    }

    if (!user && userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    const amount = data?.amount ? Number(data.amount) / 100 : undefined;

    if (transaction && transaction.status !== 'completed') {
      if (user) {
        await prisma.user.update({
          where: { id: transaction.userId },
          data: { walletBalance: { increment: transaction.amount } }
        });
      }
      await prisma.walletTransaction.update({
        where: { reference },
        data: { status: 'completed' }
      });
    } else if (!transaction && user && amount) {
      await prisma.walletTransaction.create({
        data: {
          userId: user.id,
          type: 'deposit',
          amount,
          status: 'completed',
          reference,
          metadata: { email, userId }
        }
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { walletBalance: { increment: amount } }
      });
    }
  }

  return NextResponse.json({ status: 'ok' });
}
