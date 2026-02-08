import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, isPaymentCaptured, isPaymentDenied, getResourceFromEvent, extractOrderIdFromResource } from '@/lib/payment/paypal';
import * as db from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const isValid = verifyWebhookSignature(headers, body);

    if (!isValid) {
      console.error('PayPal webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const resource = getResourceFromEvent(event);
    const orderIdStr = extractOrderIdFromResource(resource);

    if (!orderIdStr) {
      console.error('No order ID found in PayPal webhook event');
      return NextResponse.json({ received: true });
    }

    const orderId = parseInt(orderIdStr);
    const payments = await db.paymentQueries.findByOrderId(orderId);
    
    if (payments.length === 0) {
      console.error('No payment found for order:', orderId);
      return NextResponse.json({ received: true });
    }

    const payment = payments[0];

    if (isPaymentCaptured(event)) {
      await db.paymentQueries.updateStatus(payment.id, 'completed');
      await db.orderQueries.updateStatus(orderId, 'processing');
      
      console.log(`PayPal payment captured for order ${orderId}`);
    } else if (isPaymentDenied(event)) {
      await db.paymentQueries.updateStatus(payment.id, 'failed');
      
      console.log(`PayPal payment denied for order ${orderId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
