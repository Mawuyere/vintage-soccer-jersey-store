import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { query } from '@/lib/db';
import { JWTPayload } from '@/types';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
});

// GET /api/admin/analytics - Sales analytics and reporting
export const GET = withAdmin(async (req: NextRequest, _user: JWTPayload) => {
  try {
    const { searchParams } = new URL(req.url);
    const validation = analyticsQuerySchema.safeParse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      groupBy: searchParams.get('groupBy'),
      limit: searchParams.get('limit'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { startDate, endDate, groupBy, limit } = validation.data;

    // Build date filter
    let dateFilter = '';
    const dateParams: unknown[] = [];
    let paramCount = 1;

    if (startDate) {
      dateFilter += ` AND o.created_at >= $${paramCount}::timestamp`;
      dateParams.push(startDate);
      paramCount++;
    }

    if (endDate) {
      dateFilter += ` AND o.created_at <= $${paramCount}::timestamp`;
      dateParams.push(endDate);
      paramCount++;
    }

    // Total revenue (all time)
    const totalRevenueResult = await query(
      `SELECT 
        COALESCE(SUM(total_price), 0) as total_revenue,
        COUNT(*) as total_orders
       FROM orders
       WHERE status != 'cancelled'`,
      []
    );

    // Filtered revenue (based on date range)
    const filteredRevenueResult = await query(
      `SELECT 
        COALESCE(SUM(total_price), 0) as revenue,
        COUNT(*) as orders
       FROM orders o
       WHERE status != 'cancelled' ${dateFilter}`,
      dateParams
    );

    // Order counts by status
    const orderStatusResult = await query(
      `SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_price), 0) as revenue
       FROM orders
       WHERE 1=1 ${dateFilter}
       GROUP BY status
       ORDER BY count DESC`,
      dateParams
    );

    // Top selling products
    const topProductsResult = await query(
      `SELECT 
        p.id, p.name, p.team, p.year, p.sku,
        COUNT(oi.id) as order_count,
        SUM(oi.quantity) as total_sold,
        SUM(oi.price * oi.quantity) as total_revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled' ${dateFilter}
       GROUP BY p.id, p.name, p.team, p.year, p.sku
       ORDER BY total_sold DESC
       LIMIT $${paramCount}`,
      [...dateParams, limit]
    );

    // Revenue over time
    let timeGrouping = '';
    switch (groupBy) {
      case 'day':
        timeGrouping = "DATE_TRUNC('day', o.created_at)";
        break;
      case 'week':
        timeGrouping = "DATE_TRUNC('week', o.created_at)";
        break;
      case 'month':
        timeGrouping = "DATE_TRUNC('month', o.created_at)";
        break;
    }

    const revenueOverTimeResult = await query(
      `SELECT 
        ${timeGrouping} as period,
        COUNT(*) as order_count,
        COALESCE(SUM(total_price), 0) as revenue,
        COUNT(DISTINCT user_id) as unique_customers
       FROM orders o
       WHERE status != 'cancelled' ${dateFilter}
       GROUP BY period
       ORDER BY period DESC
       LIMIT 30`,
      dateParams
    );

    // Average order value
    const avgOrderValueResult = await query(
      `SELECT 
        COALESCE(AVG(total_price), 0) as avg_order_value
       FROM orders
       WHERE status != 'cancelled' ${dateFilter}`,
      dateParams
    );

    // Customer metrics
    const customerMetricsResult = await query(
      `SELECT 
        COUNT(DISTINCT user_id) as total_customers,
        COUNT(DISTINCT CASE WHEN order_count > 1 THEN user_id END) as repeat_customers
       FROM (
         SELECT user_id, COUNT(*) as order_count
         FROM orders
         WHERE status != 'cancelled' ${dateFilter}
         GROUP BY user_id
       ) customer_orders`,
      dateParams
    );

    return NextResponse.json({
      summary: {
        totalRevenue: parseFloat(totalRevenueResult.rows[0].total_revenue),
        totalOrders: parseInt(totalRevenueResult.rows[0].total_orders, 10),
        filteredRevenue: parseFloat(filteredRevenueResult.rows[0].revenue),
        filteredOrders: parseInt(filteredRevenueResult.rows[0].orders, 10),
        avgOrderValue: parseFloat(avgOrderValueResult.rows[0].avg_order_value),
        totalCustomers: parseInt(customerMetricsResult.rows[0].total_customers, 10),
        repeatCustomers: parseInt(customerMetricsResult.rows[0].repeat_customers, 10),
      },
      ordersByStatus: orderStatusResult.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count, 10),
        revenue: parseFloat(row.revenue),
      })),
      topProducts: topProductsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        team: row.team,
        year: row.year,
        sku: row.sku,
        orderCount: parseInt(row.order_count, 10),
        totalSold: parseInt(row.total_sold, 10),
        totalRevenue: parseFloat(row.total_revenue),
      })),
      revenueOverTime: revenueOverTimeResult.rows.map(row => ({
        period: row.period,
        orderCount: parseInt(row.order_count, 10),
        revenue: parseFloat(row.revenue),
        uniqueCustomers: parseInt(row.unique_customers, 10),
      })),
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        groupBy,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
});
