import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { orderQueries, cartQueries, productQueries, paymentQueries } from '@/lib/db/queries';
import { z } from 'zod';
import type { JWTPayload } from '@/types';

const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1)
});

const createOrderSchema = z.object({
  shippingAddress: addressSchema,
  paymentMethod: z.enum(['stripe', 'paypal', 'square']),
  paymentDetails: z.record(z.any()).optional()
});

export async function GET(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const offset = (page - 1) * limit;

      let orders;
      let total;

      if (user.isAdmin) {
        orders = await orderQueries.findAll(limit, offset);
        total = await orderQueries.countAll();
      } else {
        orders = await orderQueries.findByUserId(user.userId, limit, offset);
        total = await orderQueries.countByUserId(user.userId);
      }

      return NextResponse.json({
        data: orders,
        total,
        page,
        perPage: limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      const body = await req.json();
      const validated = createOrderSchema.parse(body);

      const cartItems = await cartQueries.findByUserId(user.userId);

      if (cartItems.length === 0) {
        return NextResponse.json(
          { error: 'Cart is empty' },
          { status: 400 }
        );
      }

      let totalPrice = 0;
      const orderItems = [];

      for (const cartItem of cartItems) {
        const product = await productQueries.findById(cartItem.product_id);

        if (!product) {
          return NextResponse.json(
            { error: `Product ${cartItem.product_id} not found` },
            { status: 404 }
          );
        }

        if (product.inventory < cartItem.quantity) {
          return NextResponse.json(
            { error: `Insufficient inventory for ${product.name}` },
            { status: 400 }
          );
        }

        const price = product.price;
        totalPrice += price * cartItem.quantity;

        orderItems.push({
          productId: product.id,
          quantity: cartItem.quantity,
          price,
          productSnapshot: product
        });
      }

      const shippingAddress = {
        street: validated.shippingAddress.street,
        city: validated.shippingAddress.city,
        state: validated.shippingAddress.state,
        zip: validated.shippingAddress.zip,
        country: validated.shippingAddress.country,
        isDefault: false
      };

      const order = await orderQueries.create(
        user.userId,
        totalPrice,
        shippingAddress,
        orderItems
      );

      await paymentQueries.create(
        order.id,
        validated.paymentMethod,
        totalPrice,
        undefined,
        validated.paymentDetails
      );

      await cartQueries.clearCart(user.userId);

      const fullOrder = await orderQueries.findById(order.id);

      return NextResponse.json(fullOrder, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error creating order:', error);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }
  });
}
