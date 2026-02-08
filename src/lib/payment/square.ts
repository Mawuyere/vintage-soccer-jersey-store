import { SquareClient, SquareEnvironment } from 'square';
import crypto from 'crypto';

if (!process.env.SQUARE_ACCESS_TOKEN) {
  throw new Error('SQUARE_ACCESS_TOKEN is not set');
}

const environment = process.env.SQUARE_ENVIRONMENT === 'production' 
  ? SquareEnvironment.Production 
  : SquareEnvironment.Sandbox;

const client = new SquareClient({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment,
});

export interface SquarePayment {
  id?: string;
  status?: string;
  receiptUrl?: string;
  reference_id?: string;
}

export interface SquareRefund {
  id?: string;
  status?: string;
}

export interface SquareWebhookEvent {
  type: string;
  data?: {
    object?: {
      payment?: SquarePayment;
    };
  };
}

export interface CreatePaymentParams {
  sourceId: string;
  amount: number;
  currency?: string;
  orderId: number;
  userId: number;
  locationId?: string;
}

export async function createPayment({
  sourceId,
  amount,
  currency = 'USD',
  orderId,
  userId,
  locationId,
}: CreatePaymentParams): Promise<SquarePayment> {
  try {
    const idempotencyKey = crypto.randomUUID();
    const location = locationId || process.env.SQUARE_LOCATION_ID;

    if (!location) {
      throw new Error('SQUARE_LOCATION_ID is not set');
    }

    const response = await client.payments.createPayment({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)),
        currency,
      },
      locationId: location,
      referenceId: `ORDER-${orderId}`,
      note: `Vintage Soccer Jersey Order #${orderId} - User ${userId}`,
      autocomplete: true,
    });

    return response.payment as SquarePayment;
  } catch (error) {
    console.error('Square payment creation error:', error);
    throw new Error('Failed to create Square payment');
  }
}

export async function getPayment(paymentId: string): Promise<SquarePayment> {
  try {
    const response = await client.payments.getPayment(paymentId);
    return response.payment as SquarePayment;
  } catch (error) {
    console.error('Square payment retrieval error:', error);
    throw new Error('Failed to retrieve Square payment');
  }
}

export async function cancelPayment(paymentId: string): Promise<SquarePayment> {
  try {
    const response = await client.payments.cancelPayment(paymentId);
    return response.payment as SquarePayment;
  } catch (error) {
    console.error('Square payment cancellation error:', error);
    throw new Error('Failed to cancel Square payment');
  }
}

export async function completePayment(paymentId: string): Promise<SquarePayment> {
  try {
    const response = await client.payments.completePayment(paymentId);
    return response.payment as SquarePayment;
  } catch (error) {
    console.error('Square payment completion error:', error);
    throw new Error('Failed to complete Square payment');
  }
}

export async function refundPayment(
  paymentId: string,
  amount?: number,
  currency: string = 'USD'
): Promise<SquareRefund> {
  try {
    const idempotencyKey = crypto.randomUUID();

    const refundRequest: {
      idempotencyKey: string;
      paymentId: string;
      amountMoney?: { amount: bigint; currency: string };
    } = {
      idempotencyKey,
      paymentId,
    };

    if (amount) {
      refundRequest.amountMoney = {
        amount: BigInt(Math.round(amount * 100)),
        currency,
      };
    }

    const response = await client.refunds.refundPayment(refundRequest);
    return response.refund as SquareRefund;
  } catch (error) {
    console.error('Square refund error:', error);
    throw new Error('Failed to refund Square payment');
  }
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  signatureKey?: string
): boolean {
  const webhookSignatureKey = signatureKey || process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  
  if (!webhookSignatureKey) {
    console.warn('SQUARE_WEBHOOK_SIGNATURE_KEY is not set, skipping signature verification');
    return true;
  }

  try {
    const hmac = crypto.createHmac('sha256', webhookSignatureKey);
    hmac.update(body);
    const hash = hmac.digest('base64');

    return hash === signature;
  } catch (error) {
    console.error('Square webhook verification error:', error);
    return false;
  }
}

export function isPaymentCompleted(event: SquareWebhookEvent): boolean {
  return event.type === 'payment.updated' && event.data?.object?.payment?.status === 'COMPLETED';
}

export function isPaymentFailed(event: SquareWebhookEvent): boolean {
  return event.type === 'payment.updated' && event.data?.object?.payment?.status === 'FAILED';
}

export function getPaymentFromEvent(event: SquareWebhookEvent): SquarePayment | null {
  return event.data?.object?.payment || null;
}

export function extractOrderIdFromPayment(payment: SquarePayment): string | null {
  const referenceId = payment?.reference_id;
  if (referenceId && referenceId.startsWith('ORDER-')) {
    return referenceId.replace('ORDER-', '');
  }
  return null;
}

export { client as squareClient, SquareClient };
