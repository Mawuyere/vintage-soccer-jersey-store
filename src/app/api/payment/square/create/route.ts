import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createPayment } from '@/lib/payment/square';
import * as db from '@/lib/db/queries';
import type { JWTPayload } from '@/types';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      const body = await req.json();
      const { orderId, amount, sourceId, locationId } = body;

      if (!orderId || !amount || !sourceId) {
        return NextResponse.json(
          { error: 'Order ID, amount, and source ID are required' },
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

      const squarePayment = await createPayment({
        sourceId,
        amount,
        orderId,
        userId: user.userId,
        locationId,
      });

      const paymentStatus = squarePayment.status === 'COMPLETED' ? 'completed' : 'pending';

      const payment = await db.paymentQueries.create(
        orderId,
        'square',
        amount,
        squarePayment.id,
        {
          status: squarePayment.status,
          receiptUrl: squarePayment.receiptUrl,
        }
      );

      if (paymentStatus === 'completed') {
        await db.paymentQueries.updateStatus(payment.id, 'completed', squarePayment.id);
        await db.orderQueries.updateStatus(orderId, 'processing');
      }

      return NextResponse.json({
        paymentId: squarePayment.id,
        status: squarePayment.status,
        receiptUrl: squarePayment.receiptUrl,
        dbPaymentId: payment.id,
      });
    } catch (error) {
      console.error('Square payment creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create Square payment' },
        { status: 500 }
      );
    }
  });
}
