import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramCount = 1;

    if (searchQuery) {
      conditions.push(`(p.name ILIKE $${paramCount} OR p.team ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`);
      params.push(`%${searchQuery}%`);
      paramCount++;
    }

    if (team) {
      conditions.push(`p.team ILIKE $${paramCount}`);
      params.push(`%${team}%`);
      paramCount++;
    }

    if (year) {
      conditions.push(`p.year = $${paramCount}`);
      params.push(year);
      paramCount++;
    }

    if (condition) {
      conditions.push(`p.condition = $${paramCount}`);
      params.push(condition);
      paramCount++;
    }

    if (size) {
      conditions.push(`p.size = $${paramCount}`);
      params.push(size);
      paramCount++;
    }

    if (minPrice !== undefined) {
      conditions.push(`p.price >= $${paramCount}`);
      params.push(minPrice);
      paramCount++;
    }

    if (maxPrice !== undefined) {
      conditions.push(`p.price <= $${paramCount}`);
      params.push(maxPrice);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    params.push(limit, offset);

    const result = await query(
      `SELECT p.*, 
       COALESCE(json_agg(pi.*) FILTER (WHERE pi.id IS NOT NULL), '[]') as images
       FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id
       ${whereClause}
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM products p
       ${whereClause}`,
      params.slice(0, -2)
    );

    const total = parseInt(countResult.rows[0].count, 10);

    return NextResponse.json({
      data: result.rows,
      total,
      page,
      perPage: limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
