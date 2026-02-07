import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { query } from '@/lib/db';
import { JWTPayload } from '@/types';

// GET /api/admin/analytics/dashboard - Dashboard stats
export const GET = withAdmin(async (_req: NextRequest, _user: JWTPayload) => {
  try {
    // Today's sales summary
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySalesResult = await query(
      `SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(total_price), 0) as revenue,
        COUNT(DISTINCT user_id) as customer_count
       FROM orders
       WHERE created_at >= $1 AND status != 'cancelled'`,
      [todayStart.toISOString()]
    );

    // Yesterday's sales for comparison
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const yesterdaySalesResult = await query(
      `SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(total_price), 0) as revenue
       FROM orders
       WHERE created_at >= $1 AND created_at < $2 AND status != 'cancelled'`,
      [yesterdayStart.toISOString(), todayStart.toISOString()]
    );

    // Pending orders (requiring action)
    const pendingOrdersResult = await query(
      `SELECT 
        COUNT(*) as pending_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as payment_pending,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing
       FROM orders
       WHERE status IN ('pending', 'processing')`,
      []
    );

    // Low inventory products (< 5 items)
    const lowInventoryResult = await query(
      `SELECT 
        id, name, team, year, sku, inventory, price,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url
       FROM products p
       WHERE inventory > 0 AND inventory < 5
       ORDER BY inventory ASC, name ASC
       LIMIT 20`,
      []
    );

    // Out of stock products
    const outOfStockResult = await query(
      `SELECT COUNT(*) as count
       FROM products
       WHERE inventory = 0`,
      []
    );

    // Recent orders (last 10)
    const recentOrdersResult = await query(
      `SELECT 
        o.id, o.total_price, o.status, o.created_at,
        u.email, u.name as customer_name,
        COUNT(oi.id) as item_count
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id, u.email, u.name
       ORDER BY o.created_at DESC
       LIMIT 10`,
      []
    );

    // This month's performance
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthPerformanceResult = await query(
      `SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(total_price), 0) as revenue,
        COUNT(DISTINCT user_id) as customer_count
       FROM orders
       WHERE created_at >= $1 AND status != 'cancelled'`,
      [monthStart.toISOString()]
    );

    // Last month's performance for comparison
    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthEnd = new Date(monthStart);

    const lastMonthPerformanceResult = await query(
      `SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(total_price), 0) as revenue
       FROM orders
       WHERE created_at >= $1 AND created_at < $2 AND status != 'cancelled'`,
      [lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    // Total inventory value
    const inventoryValueResult = await query(
      `SELECT 
        SUM(inventory) as total_items,
        COALESCE(SUM(price * inventory), 0) as total_value
       FROM products
       WHERE inventory > 0`,
      []
    );

    // Calculate growth percentages
    const todayRevenue = parseFloat(todaySalesResult.rows[0].revenue);
    const yesterdayRevenue = parseFloat(yesterdaySalesResult.rows[0].revenue);
    const todayGrowth = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : 0;

    const monthRevenue = parseFloat(monthPerformanceResult.rows[0].revenue);
    const lastMonthRevenue = parseFloat(lastMonthPerformanceResult.rows[0].revenue);
    const monthGrowth = lastMonthRevenue > 0 
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    return NextResponse.json({
      today: {
        revenue: todayRevenue,
        orders: parseInt(todaySalesResult.rows[0].order_count, 10),
        customers: parseInt(todaySalesResult.rows[0].customer_count, 10),
        growth: parseFloat(todayGrowth.toFixed(2)),
      },
      thisMonth: {
        revenue: monthRevenue,
        orders: parseInt(monthPerformanceResult.rows[0].order_count, 10),
        customers: parseInt(monthPerformanceResult.rows[0].customer_count, 10),
        growth: parseFloat(monthGrowth.toFixed(2)),
      },
      pendingOrders: {
        total: parseInt(pendingOrdersResult.rows[0].pending_count, 10),
        paymentPending: parseInt(pendingOrdersResult.rows[0].payment_pending, 10),
        processing: parseInt(pendingOrdersResult.rows[0].processing, 10),
      },
      inventory: {
        lowStock: lowInventoryResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          team: row.team,
          year: row.year,
          sku: row.sku,
          inventory: row.inventory,
          price: parseFloat(row.price),
          imageUrl: row.image_url,
        })),
        outOfStock: parseInt(outOfStockResult.rows[0].count, 10),
        totalItems: parseInt(inventoryValueResult.rows[0].total_items, 10) || 0,
        totalValue: parseFloat(inventoryValueResult.rows[0].total_value) || 0,
      },
      recentOrders: recentOrdersResult.rows.map(row => ({
        id: row.id,
        totalPrice: parseFloat(row.total_price),
        status: row.status,
        createdAt: row.created_at,
        customerEmail: row.email,
        customerName: row.customer_name,
        itemCount: parseInt(row.item_count, 10),
      })),
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
});
