import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/middleware';
import { orderQueries } from '@/lib/db/queries';
import { z } from 'zod';
import type { JWTPayload } from '@/types';

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  trackingNumber: z.string().optional(),
  notes: z.string().optional()
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(req, async (req: NextRequest, user: JWTPayload) => {
    try {
      const { id } = await params;
      const orderId = parseInt(id, 10);

      if (isNaN(orderId)) {
        return NextResponse.json(
          { error: 'Invalid order ID' },
          { status: 400 }
        );
      }

      const order = await orderQueries.findById(orderId);

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      if (!user.isAdmin && order.user_id !== user.userId) {
        return NextResponse.json(
          { error: 'Unauthorized to view this order' },
          { status: 403 }
        );
      }

      return NextResponse.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(req, async (req: NextRequest, _user: JWTPayload) => {
    try {
      const { id } = await params;
      const orderId = parseInt(id, 10);

      if (isNaN(orderId)) {
        return NextResponse.json(
          { error: 'Invalid order ID' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const validated = updateOrderStatusSchema.parse(body);

      const order = await orderQueries.findById(orderId);

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      await orderQueries.updateStatus(orderId, validated.status);

      if (validated.trackingNumber) {
        await orderQueries.updateTracking(orderId, validated.trackingNumber);
      }

      if (validated.notes) {
        await orderQueries.addNotes(orderId, validated.notes);
      }

      const updatedOrder = await orderQueries.findById(orderId);

      return NextResponse.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error updating order:', error);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }
  });
}
