import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { query } from '@/lib/db';
import { userQueries, adminQueries } from '@/lib/db/queries';
import { JWTPayload } from '@/types';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';

const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().optional().nullable(),
  emailVerified: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
  role: z.enum(['admin', 'super_admin']).optional(),
  permissions: z.record(z.boolean()).optional(),
});

// GET /api/admin/users/[id] - Get user by ID
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAdmin(async (_request: NextRequest, _user: JWTPayload) => {
    try {
      const { id } = await context.params;
      const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Get user with admin info
    const result = await query(
      `SELECT 
        u.id, u.email, u.name, u.phone, u.email_verified, u.created_at, u.updated_at,
        au.id as admin_id, au.role, au.permissions
       FROM users u
       LEFT JOIN admin_users au ON u.id = au.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const userData = {
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      emailVerified: row.email_verified,
      isAdmin: !!row.admin_id,
      role: row.role,
      permissions: row.permissions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return NextResponse.json({ user: userData });
    } catch (error) {
      console.error('Get user error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }
  })(req, user);
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAdmin(async (_request: NextRequest, _user: JWTPayload) => {
    try {
      const { id } = await context.params;
      const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Check if user exists
    const existingUser = await userQueries.findById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare user updates
    const userUpdates: Record<string, unknown> = {};
    if (updates.email !== undefined) userUpdates.email = updates.email;
    if (updates.name !== undefined) userUpdates.name = updates.name;
    if (updates.phone !== undefined) userUpdates.phone = updates.phone;
    if (updates.emailVerified !== undefined) userUpdates.email_verified = updates.emailVerified;
    
    if (updates.password !== undefined) {
      userUpdates.password_hash = await bcrypt.hash(updates.password, 10);
    }

    // Update user table if there are changes
    if (Object.keys(userUpdates).length > 0) {
      await userQueries.update(userId, userUpdates);
    }

    // Handle admin status changes
    const currentAdminStatus = await adminQueries.findByUserId(userId);
    
    if (updates.isAdmin !== undefined) {
      if (updates.isAdmin && !currentAdminStatus) {
        // Make user an admin
        await adminQueries.create(
          userId,
          updates.role || 'admin',
          updates.permissions || {}
        );
      } else if (!updates.isAdmin && currentAdminStatus) {
        // Remove admin status
        await query('DELETE FROM admin_users WHERE user_id = $1', [userId]);
      } else if (updates.isAdmin && currentAdminStatus) {
        // Update admin info
        const adminUpdates: string[] = [];
        const adminParams: unknown[] = [];
        let paramCount = 1;

        if (updates.role !== undefined) {
          adminUpdates.push(`role = $${paramCount}`);
          adminParams.push(updates.role);
          paramCount++;
        }

        if (updates.permissions !== undefined) {
          adminUpdates.push(`permissions = $${paramCount}`);
          adminParams.push(JSON.stringify(updates.permissions));
          paramCount++;
        }

        if (adminUpdates.length > 0) {
          adminParams.push(userId);
          await query(
            `UPDATE admin_users SET ${adminUpdates.join(', ')} WHERE user_id = $${paramCount}`,
            adminParams
          );
        }
      }
    }

    // Fetch updated user with admin info
    const result = await query(
      `SELECT 
        u.id, u.email, u.name, u.phone, u.email_verified, u.created_at, u.updated_at,
        au.id as admin_id, au.role, au.permissions
       FROM users u
       LEFT JOIN admin_users au ON u.id = au.user_id
       WHERE u.id = $1`,
      [userId]
    );

    const row = result.rows[0];
    const userData = {
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      emailVerified: row.email_verified,
      isAdmin: !!row.admin_id,
      role: row.role,
      permissions: row.permissions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return NextResponse.json({
      message: 'User updated successfully',
      user: userData,
    });
    } catch (error) {
      console.error('Update user error:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
  })(req, user);
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAdmin(async (_request: NextRequest, user: JWTPayload) => {
    try {
      const { id } = await context.params;
      const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (userId === user.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    // Check if user exists
    const existingUser = await userQueries.findById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user (cascading deletes should handle related records)
    await userQueries.delete(userId);

    return NextResponse.json({
      message: 'User deleted successfully',
    });
    } catch (error) {
      console.error('Delete user error:', error);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
  })(req, user);
}
