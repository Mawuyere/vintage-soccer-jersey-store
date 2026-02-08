import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createPaymentIntent } from '@/lib/payment/stripe';
import { createOrder as createPayPalOrder } from '@/lib/payment/paypal';
import { createPayment as createSquarePayment } from '@/lib/payment/square';
import * as db from '@/lib/db/queries';
import type { JWTPayload, Order } from '@/types';

interface CheckoutRequestBody {
  orderId?: number;
  cartItems?: Array<{ productId: number; quantity: number }>;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: 'stripe' | 'paypal' | 'square';
  paymentDetails?: {
    sourceId?: string;
    locationId?: string;
    returnUrl?: string;
    cancelUrl?: string;
  };
}

async function createOrderFromCart(
  userId: number,
  cartItems: Array<{ productId: number; quantity: number }>,
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }
): Promise<Order> {
  const items = await Promise.all(
    cartItems.map(async (item) => {
      const product = await db.productQueries.findById(item.productId);
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (product.inventory < item.quantity) {
        throw new Error(`Insufficient inventory for ${product.name}`);
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        productSnapshot: product,
      };
    })
  );

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await db.orderQueries.create(userId, totalPrice, shippingAddress, items);
  
  await db.cartQueries.clearCart(userId);

  return {
    ...order,
    shippingAddress,
  } as Order;
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      const body: CheckoutRequestBody = await req.json();
      const { orderId, cartItems, shippingAddress, paymentMethod, paymentDetails = {} } = body;

      if (!paymentMethod || !['stripe', 'paypal', 'square'].includes(paymentMethod)) {
        return NextResponse.json(
          { error: 'Valid payment method is required (stripe, paypal, or square)' },
          { status: 400 }
        );
      }

      let order: Order;

      if (orderId) {
        const existingOrder = await db.orderQueries.findById(orderId);
        
        if (!existingOrder) {
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          );
        }

        if (existingOrder.user_id !== user.userId) {
          return NextResponse.json(
            { error: 'Unauthorized to access this order' },
            { status: 403 }
          );
        }

        order = existingOrder;
      } else {
        if (!cartItems || !shippingAddress) {
          return NextResponse.json(
            { error: 'Cart items and shipping address are required for new orders' },
            { status: 400 }
          );
        }

        order = await createOrderFromCart(user.userId, cartItems, shippingAddress);
      }

      const amount = parseFloat(order.total_price.toString());

      let paymentResponse: Record<string, unknown>;

      switch (paymentMethod) {
        case 'stripe': {
          const paymentIntent = await createPaymentIntent({
            amount,
            orderId: order.id,
            userId: user.userId,
          });

          const payment = await db.paymentQueries.create(
            order.id,
            'stripe',
            amount,
            paymentIntent.id,
            {
              clientSecret: paymentIntent.client_secret,
              status: paymentIntent.status,
            }
          );

          paymentResponse = {
            paymentMethod: 'stripe',
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            paymentId: payment.id,
          };
          break;
        }

        case 'paypal': {
          const paypalOrder = await createPayPalOrder({
            amount,
            orderId: order.id,
            userId: user.userId,
            returnUrl: paymentDetails.returnUrl,
            cancelUrl: paymentDetails.cancelUrl,
          });

          const payment = await db.paymentQueries.create(
            order.id,
            'paypal',
            amount,
            paypalOrder.id,
            {
              status: paypalOrder.status,
              links: paypalOrder.links,
            }
          );

          const approvalLink = paypalOrder.links?.find(link => link.rel === 'approve');

          paymentResponse = {
            paymentMethod: 'paypal',
            orderId: paypalOrder.id,
            approvalUrl: approvalLink?.href,
            paymentId: payment.id,
          };
          break;
        }

        case 'square': {
          if (!paymentDetails.sourceId) {
            return NextResponse.json(
              { error: 'Source ID is required for Square payments' },
              { status: 400 }
            );
          }

          const squarePayment = await createSquarePayment({
            sourceId: paymentDetails.sourceId,
            amount,
            orderId: order.id,
            userId: user.userId,
            locationId: paymentDetails.locationId,
          });

          const paymentStatus = squarePayment.status === 'COMPLETED' ? 'completed' : 'pending';

          const payment = await db.paymentQueries.create(
            order.id,
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
            await db.orderQueries.updateStatus(order.id, 'processing');
          }

          paymentResponse = {
            paymentMethod: 'square',
            paymentId: squarePayment.id,
            status: squarePayment.status,
            receiptUrl: squarePayment.receiptUrl,
            dbPaymentId: payment.id,
          };
          break;
        }

        default:
          return NextResponse.json(
            { error: 'Invalid payment method' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount,
        ...paymentResponse,
      });
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process checkout';
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  });
}
