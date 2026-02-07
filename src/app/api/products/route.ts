import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/middleware';
import { productQueries, productImageQueries } from '@/lib/db/queries';
import { z } from 'zod';
import type { JWTPayload } from '@/types';

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  team: z.string().min(1, 'Team is required'),
  year: z.string().min(4, 'Year is required'),
  price: z.number().positive('Price must be positive'),
  condition: z.enum(['Mint', 'Excellent', 'Good', 'Fair']),
  size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  description: z.string().min(1, 'Description is required'),
  sku: z.string().min(1, 'SKU is required'),
  inventory: z.number().int().min(0).default(1),
  featured: z.boolean().default(false),
  images: z.array(z.object({
    imageUrl: z.string().url(),
    altText: z.string().optional(),
    displayOrder: z.number().int().min(0)
  })).optional()
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const team = searchParams.get('team') || undefined;
    const year = searchParams.get('year') || undefined;
    const condition = searchParams.get('condition') || undefined;
    const size = searchParams.get('size') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;

    const filters = {
      team,
      year,
      condition,
      size,
      minPrice,
      maxPrice
    };

    const products = await productQueries.search(filters, limit, offset);
    const total = await productQueries.count(filters);

    return NextResponse.json({
      data: products,
      total,
      page,
      perPage: limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return requireAdmin(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      const body = await req.json();
      const validated = createProductSchema.parse(body);

      const existingSku = await productQueries.findBySku(validated.sku);
      if (existingSku) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        );
      }

      const product = await productQueries.create({
        name: validated.name,
        team: validated.team,
        year: validated.year,
        price: validated.price,
        condition: validated.condition,
        size: validated.size,
        description: validated.description,
        sku: validated.sku,
        inventory: validated.inventory,
        featured: validated.featured
      });

      console.log(`[AUDIT] Product created by admin user ${user.userId} (${user.email}): SKU ${validated.sku}, ID ${product.id}`);

      if (validated.images && validated.images.length > 0) {
        for (const image of validated.images) {
          await productImageQueries.create(
            product.id,
            image.imageUrl,
            image.altText,
            image.displayOrder
          );
        }
      }

      const productWithImages = await productQueries.findById(product.id);

      return NextResponse.json(productWithImages, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }
  });
}
