import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createPaymentIntent } from '@/lib/payment/stripe';
import * as db from '@/lib/db/queries';
import type { JWTPayload } from '@/types';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      const body = await req.json();
      const { orderId, amount } = body;

      if (!orderId || !amount) {
        return NextResponse.json(
          { error: 'Order ID and amount are required' },
          { status: 400 }
        );
      }

      const order = await db.orderQueries.findById(orderId);

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      if (order.user_id !== user.userId) {
        return NextResponse.json(
          { error: 'Unauthorized to access this order' },
          { status: 403 }
        );
      }

      if (order.status !== 'pending') {
        return NextResponse.json(
          { error: 'Order is not in pending status' },
          { status: 400 }
        );
      }

      const paymentIntent = await createPaymentIntent({
        amount,
        orderId,
        userId: user.userId,
        metadata: {
          orderNumber: order.id.toString(),
        },
      });

      const payment = await db.paymentQueries.create(
        orderId,
        'stripe',
        amount,
        paymentIntent.id,
        {
          clientSecret: paymentIntent.client_secret,
          status: paymentIntent.status,
        }
      );

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        paymentId: payment.id,
      });
    } catch (error) {
      console.error('Stripe payment intent creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create payment intent' },
        { status: 500 }
      );
    }
  });
}
