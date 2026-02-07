import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createOrder } from '@/lib/payment/paypal';
import * as db from '@/lib/db/queries';
import type { JWTPayload } from '@/types';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      const body = await req.json();
      const { orderId, amount, returnUrl, cancelUrl } = body;

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

      const paypalOrder = await createOrder({
        amount,
        orderId,
        userId: user.userId,
        returnUrl,
        cancelUrl,
      });

      const payment = await db.paymentQueries.create(
        orderId,
        'paypal',
        amount,
        paypalOrder.id,
        {
          status: paypalOrder.status,
          links: paypalOrder.links,
        }
      );

      const approvalLink = paypalOrder.links?.find(link => link.rel === 'approve');

      return NextResponse.json({
        orderId: paypalOrder.id,
        approvalUrl: approvalLink?.href,
        paymentId: payment.id,
      });
    } catch (error) {
      console.error('PayPal order creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create PayPal order' },
        { status: 500 }
      );
    }
  });
}
