import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/middleware';
import { productQueries } from '@/lib/db/queries';
import { z } from 'zod';
import type { JWTPayload } from '@/types';

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  team: z.string().min(1).optional(),
  year: z.string().min(4).optional(),
  price: z.number().positive().optional(),
  condition: z.enum(['Mint', 'Excellent', 'Good', 'Fair']).optional(),
  size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']).optional(),
  description: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  inventory: z.number().int().min(0).optional(),
  featured: z.boolean().optional()
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await productQueries.findById(productId);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(req, async (req: NextRequest, _user: JWTPayload) => {
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
      const validated = updateProductSchema.parse(body);

      if (Object.keys(validated).length === 0) {
        return NextResponse.json(
          { error: 'No fields to update' },
          { status: 400 }
        );
      }

      if (validated.sku) {
        const existingSku = await productQueries.findBySku(validated.sku);
        if (existingSku && existingSku.id !== productId) {
          return NextResponse.json(
            { error: 'SKU already exists' },
            { status: 400 }
          );
        }
      }

      const product = await productQueries.update(productId, validated);

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      const productWithImages = await productQueries.findById(productId);

      return NextResponse.json(productWithImages);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error updating product:', error);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(req, async (_req: NextRequest, _user: JWTPayload) => {
    try {
      const { id } = await params;
      const productId = parseInt(id, 10);

      if (isNaN(productId)) {
        return NextResponse.json(
          { error: 'Invalid product ID' },
          { status: 400 }
        );
      }

      const product = await productQueries.findById(productId);

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      await productQueries.delete(productId);

      return NextResponse.json(
        { message: 'Product deleted successfully' },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }
  });
}
