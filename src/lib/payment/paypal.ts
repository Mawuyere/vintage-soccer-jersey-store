import { Client, Environment, OrdersController, PaymentsController } from '@paypal/paypal-server-sdk';
import crypto from 'crypto';

if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  throw new Error('PayPal credentials are not set');
}

const environment = process.env.PAYPAL_MODE === 'production' 
  ? Environment.Production 
  : Environment.Sandbox;

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
  },
  environment,
});

const ordersController = new OrdersController(client);
const paymentsController = new PaymentsController(client);

export interface PayPalOrder {
  id: string;
  status: string;
  links?: Array<{ rel: string; href: string }>;
  purchase_units?: Array<{
    custom_id?: string;
    invoice_id?: string;
    payments?: {
      captures?: Array<{ custom_id?: string }>;
    };
  }>;
}

export interface PayPalCapture {
  id: string;
  status: string;
  purchase_units?: Array<{
    custom_id?: string;
    payments?: {
      captures?: Array<{ custom_id?: string }>;
    };
  }>;
}

export interface PayPalRefund {
  id: string;
  status: string;
}

export interface PayPalWebhookEvent {
  event_type: string;
  resource: Record<string, unknown>;
}

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  orderId: number;
  userId: number;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CapturePaymentParams {
  orderId: string;
}

export async function createOrder({
  amount,
  currency = 'USD',
  orderId,
  returnUrl,
  cancelUrl,
}: CreateOrderParams): Promise<PayPalOrder> {
  try {
    const requestBody = {
      intent: 'CAPTURE',
      purchaseUnits: [
        {
          amount: {
            currencyCode: currency,
            value: amount.toFixed(2),
          },
          customId: `${orderId}`,
          invoiceId: `ORDER-${orderId}`,
          description: `Vintage Soccer Jersey Order #${orderId}`,
        },
      ],
      applicationContext: {
        brandName: 'Vintage Soccer Jersey Store',
        landingPage: 'NO_PREFERENCE',
        userAction: 'PAY_NOW',
        returnUrl: returnUrl,
        cancelUrl: cancelUrl,
      },
    };

    const response = await ordersController.createOrder({ body: requestBody });
    return response.result as unknown as PayPalOrder;
  } catch (error) {
    console.error('PayPal order creation error:', error);
    throw new Error('Failed to create PayPal order');
  }
}

export async function capturePayment({ orderId }: CapturePaymentParams): Promise<PayPalCapture> {
  try {
    const response = await ordersController.ordersCapture({
      id: orderId,
    });
    return response.result as unknown as PayPalCapture;
  } catch (error) {
    console.error('PayPal payment capture error:', error);
    throw new Error('Failed to capture PayPal payment');
  }
}

export async function getOrder(orderId: string): Promise<PayPalOrder> {
  try {
    const response = await ordersController.ordersGet(orderId);
    return response.result as unknown as PayPalOrder;
  } catch (error) {
    console.error('PayPal order retrieval error:', error);
    throw new Error('Failed to retrieve PayPal order');
  }
}

export async function refundPayment(captureId: string, amount?: number): Promise<PayPalRefund> {
  try {
    const requestBody: { amount?: { currencyCode: string; value: string } } = {};

    if (amount) {
      requestBody.amount = {
        currencyCode: 'USD',
        value: amount.toFixed(2),
      };
    }

    const response = await paymentsController.capturesRefund({
      captureId,
      body: requestBody,
    });
    return response.result as unknown as PayPalRefund;
  } catch (error) {
    console.error('PayPal refund error:', error);
    throw new Error('Failed to refund PayPal payment');
  }
}

export function verifyWebhookSignature(
  headers: Record<string, string>,
  payload: string,
  webhookId?: string
): boolean {
  const webhookSecret = webhookId || process.env.PAYPAL_WEBHOOK_ID;
  
  if (!webhookSecret) {
    console.warn('PAYPAL_WEBHOOK_ID is not set, skipping signature verification');
    return true;
  }

  try {
    const transmissionId = headers['paypal-transmission-id'];
    const transmissionTime = headers['paypal-transmission-time'];
    const certUrl = headers['paypal-cert-url'];
    const authAlgo = headers['paypal-auth-algo'];
    const transmissionSig = headers['paypal-transmission-sig'];

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      console.error('Missing PayPal webhook headers');
      return false;
    }

    const expectedSignature = crypto
      .createHash('sha256')
      .update(`${transmissionId}|${transmissionTime}|${webhookSecret}|${crypto.createHash('sha256').update(payload).digest('hex')}`)
      .digest('base64');

    return transmissionSig === expectedSignature;
  } catch (error) {
    console.error('PayPal webhook verification error:', error);
    return false;
  }
}

export function isPaymentCaptured(event: PayPalWebhookEvent): boolean {
  return event.event_type === 'PAYMENT.CAPTURE.COMPLETED';
}

export function isPaymentDenied(event: PayPalWebhookEvent): boolean {
  return event.event_type === 'PAYMENT.CAPTURE.DENIED';
}

export function getResourceFromEvent(event: PayPalWebhookEvent): Record<string, unknown> {
  return event.resource;
}

export function extractOrderIdFromResource(resource: Record<string, unknown>): string | null {
  const customId = resource?.custom_id as string | undefined;
  const invoiceId = resource?.invoice_id as string | undefined;
  
  if (customId) return customId;
  if (invoiceId && typeof invoiceId === 'string') {
    return invoiceId.replace('ORDER-', '');
  }
  return null;
}
