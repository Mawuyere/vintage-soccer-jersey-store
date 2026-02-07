import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, getPaymentIntentFromEvent, isPaymentSucceeded, isPaymentFailed } from '@/lib/payment/stripe';
import * as db from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const paymentIntent = getPaymentIntentFromEvent(event);

    if (!paymentIntent) {
      return NextResponse.json({ received: true });
    }

    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      console.error('No order ID in payment intent metadata');
      return NextResponse.json({ received: true });
    }

    const payments = await db.paymentQueries.findByOrderId(parseInt(orderId));
    const payment = payments.find(p => p.transaction_id === paymentIntent.id);

    if (!payment) {
      console.error('Payment not found for transaction:', paymentIntent.id);
      return NextResponse.json({ received: true });
    }

    if (isPaymentSucceeded(event)) {
      await db.paymentQueries.updateStatus(payment.id, 'completed', paymentIntent.id);
      await db.orderQueries.updateStatus(parseInt(orderId), 'processing');
      
      console.log(`Payment succeeded for order ${orderId}`);
    } else if (isPaymentFailed(event)) {
      await db.paymentQueries.updateStatus(payment.id, 'failed', paymentIntent.id);
      
      console.log(`Payment failed for order ${orderId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
