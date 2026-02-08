import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { cartQueries, productQueries } from '@/lib/db/queries';
import { z } from 'zod';
import type { JWTPayload } from '@/types';

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive()
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      const { id } = await params;
      const productId = parseInt(id, 10);

      if (isNaN(productId)) {
        return NextResponse.json(
          { error: 'Invalid product ID' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const validated = updateCartItemSchema.parse(body);

      const product = await productQueries.findById(productId);

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

      const cartItem = await cartQueries.updateQuantity(
        user.userId,
        productId,
        validated.quantity
      );

      if (!cartItem) {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error updating cart item:', error);
      return NextResponse.json(
        { error: 'Failed to update cart item' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      const { id } = await params;
      const productId = parseInt(id, 10);

      if (isNaN(productId)) {
        return NextResponse.json(
          { error: 'Invalid product ID' },
          { status: 400 }
        );
      }

      await cartQueries.removeItem(user.userId, productId);

      return NextResponse.json(
        { message: 'Item removed from cart' },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error removing cart item:', error);
      return NextResponse.json(
        { error: 'Failed to remove cart item' },
        { status: 500 }
      );
    }
  });
}
