import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { capturePayment } from '@/lib/payment/paypal';
import * as db from '@/lib/db/queries';
import type { JWTPayload } from '@/types';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      const body = await req.json();
      const { orderId } = body;

      if (!orderId) {
        return NextResponse.json(
          { error: 'PayPal order ID is required' },
          { status: 400 }
        );
      }

      const capture = await capturePayment({ orderId });

      if (capture.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'Payment capture failed', details: capture },
          { status: 400 }
        );
      }

      const customId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id ||
                       capture.purchase_units?.[0]?.custom_id;

      if (!customId) {
        console.error('No order ID found in PayPal capture response');
        return NextResponse.json(
          { error: 'Invalid PayPal response' },
          { status: 500 }
        );
      }

      const dbOrderId = parseInt(customId);
      const payments = await db.paymentQueries.findByOrderId(dbOrderId);
      const payment = payments.find(p => p.transaction_id === orderId);

      if (!payment) {
        console.error('Payment not found for PayPal order:', orderId);
        return NextResponse.json(
          { error: 'Payment record not found' },
          { status: 404 }
        );
      }

      const order = await db.orderQueries.findById(dbOrderId);
      if (order.user_id !== user.userId) {
        return NextResponse.json(
          { error: 'Unauthorized to access this order' },
          { status: 403 }
        );
      }

      await db.paymentQueries.updateStatus(payment.id, 'completed', orderId);
      await db.orderQueries.updateStatus(dbOrderId, 'processing');

      return NextResponse.json({
        success: true,
        captureId: capture.id,
        status: capture.status,
      });
    } catch (error) {
      console.error('PayPal payment capture error:', error);
      return NextResponse.json(
        { error: 'Failed to capture PayPal payment' },
        { status: 500 }
      );
    }
  });
}
