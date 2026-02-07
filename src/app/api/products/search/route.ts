import { NextRequest, NextResponse } from 'next/server';
import { productQueries } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const searchQuery = searchParams.get('q') || '';
    const team = searchParams.get('team') || undefined;
    const year = searchParams.get('year') || undefined;
    const condition = searchParams.get('condition') || undefined;
    const size = searchParams.get('size') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;

    const filters = {
      team: searchQuery ? searchQuery : team,
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
      totalPages: Math.ceil(total / limit),
      query: searchQuery
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
