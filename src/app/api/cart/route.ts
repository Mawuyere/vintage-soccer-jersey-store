import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { cartQueries, productQueries } from '@/lib/db/queries';
import { z } from 'zod';
import type { JWTPayload } from '@/types';

const addToCartSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1)
});

export async function GET(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      const cartItems = await cartQueries.findByUserId(user.userId);

      return NextResponse.json({
        items: cartItems,
        count: cartItems.length
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cart' },
        { status: 500 }
      );
    }
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      const body = await req.json();
      const validated = addToCartSchema.parse(body);

      const product = await productQueries.findById(validated.productId);

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      if (product.inventory < validated.quantity) {
        return NextResponse.json(
          { error: 'Insufficient inventory' },
          { status: 400 }
        );
      }

      const cartItem = await cartQueries.addItem(
        user.userId,
        validated.productId,
        validated.quantity
      );

      return NextResponse.json(cartItem, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error adding to cart:', error);
      return NextResponse.json(
        { error: 'Failed to add item to cart' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      await cartQueries.clearCart(user.userId);

      return NextResponse.json(
        { message: 'Cart cleared successfully' },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error clearing cart:', error);
      return NextResponse.json(
        { error: 'Failed to clear cart' },
        { status: 500 }
      );
    }
  });
}
