import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  orderId: number;
  userId: number;
  metadata?: Record<string, string>;
}

export interface ProcessPaymentParams {
  paymentIntentId: string;
  paymentMethodId?: string;
}

export async function createPaymentIntent({
  amount,
  currency = 'usd',
  orderId,
  userId,
  metadata = {},
}: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: {
        orderId: orderId.toString(),
        userId: userId.toString(),
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    throw new Error('Failed to create payment intent');
  }
}

export async function processPayment({
  paymentIntentId,
  paymentMethodId,
}: ProcessPaymentParams): Promise<Stripe.PaymentIntent> {
  try {
    if (paymentMethodId) {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });
      return paymentIntent;
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment processing error:', error);
    throw new Error('Failed to process payment');
  }
}

export async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Stripe payment intent retrieval error:', error);
    throw new Error('Failed to retrieve payment intent');
  }
}

export async function cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  try {
    return await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (error) {
    console.error('Stripe payment intent cancellation error:', error);
    throw new Error('Failed to cancel payment intent');
  }
}

export async function createRefund(
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> {
  try {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    return await stripe.refunds.create(refundParams);
  } catch (error) {
    console.error('Stripe refund creation error:', error);
    throw new Error('Failed to create refund');
  }
}

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret?: string
): Stripe.Event {
  const webhookSecret = secret || process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook verification error:', error);
    throw new Error('Invalid webhook signature');
  }
}

export function isPaymentSucceeded(event: Stripe.Event): boolean {
  return event.type === 'payment_intent.succeeded';
}

export function isPaymentFailed(event: Stripe.Event): boolean {
  return event.type === 'payment_intent.payment_failed';
}

export function getPaymentIntentFromEvent(event: Stripe.Event): Stripe.PaymentIntent | null {
  if (event.type.startsWith('payment_intent.')) {
    return event.data.object as Stripe.PaymentIntent;
  }
  return null;
}

export { stripe };
