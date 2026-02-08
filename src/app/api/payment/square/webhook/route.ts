import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, isPaymentCompleted, isPaymentFailed, getPaymentFromEvent, extractOrderIdFromPayment } from '@/lib/payment/square';
import * as db from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-square-hmacsha256-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    const isValid = verifyWebhookSignature(body, signature);

    if (!isValid) {
      console.error('Square webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    const payment = getPaymentFromEvent(event);

    if (!payment) {
      return NextResponse.json({ received: true });
    }

    const orderIdStr = extractOrderIdFromPayment(payment);

    if (!orderIdStr) {
      console.error('No order ID found in Square webhook event');
      return NextResponse.json({ received: true });
    }

    const orderId = parseInt(orderIdStr);
    const payments = await db.paymentQueries.findByOrderId(orderId);
    const dbPayment = payments.find(p => p.transaction_id === payment.id);

    if (!dbPayment) {
      console.error('Payment not found for Square payment:', payment.id);
      return NextResponse.json({ received: true });
    }

    if (isPaymentCompleted(event)) {
      await db.paymentQueries.updateStatus(dbPayment.id, 'completed', payment.id);
      await db.orderQueries.updateStatus(orderId, 'processing');
      
      console.log(`Square payment completed for order ${orderId}`);
    } else if (isPaymentFailed(event)) {
      await db.paymentQueries.updateStatus(dbPayment.id, 'failed', payment.id);
      
      console.log(`Square payment failed for order ${orderId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Square webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
