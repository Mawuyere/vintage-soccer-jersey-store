import { NextRequest, NextResponse } from 'next/server';
import { productQueries } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const products = await productQueries.search(
      { featured: true },
      limit,
      offset
    );

    return NextResponse.json({
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}
