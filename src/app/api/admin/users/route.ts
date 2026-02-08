import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { query } from '@/lib/db';
import { userQueries, adminQueries } from '@/lib/db/queries';
import { JWTPayload } from '@/types';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';

const createAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'super_admin']).default('admin'),
  permissions: z.record(z.boolean()).optional(),
});

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  search: z.string().optional(),
  role: z.enum(['all', 'admin', 'user']).optional().default('all'),
});

// GET /api/admin/users - List all users with pagination
export const GET = withAdmin(async (req: NextRequest, _user: JWTPayload) => {
  try {
    const { searchParams } = new URL(req.url);
    const validation = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      role: searchParams.get('role'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, search, role } = validation.data;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: unknown[] = [];
    let paramCount = 1;

    if (search) {
      whereConditions.push(`(u.email ILIKE $${paramCount} OR u.name ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (role === 'admin') {
      whereConditions.push('au.id IS NOT NULL');
    } else if (role === 'user') {
      whereConditions.push('au.id IS NULL');
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get users with admin info
    const usersResult = await query(
      `SELECT 
        u.id, u.email, u.name, u.phone, u.email_verified, u.created_at, u.updated_at,
        au.id as admin_id, au.role, au.permissions
       FROM users u
       LEFT JOIN admin_users au ON u.id = au.user_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count
       FROM users u
       LEFT JOIN admin_users au ON u.id = au.user_id
       ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    const users = usersResult.rows.map(row => ({
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
    }));

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
});

// POST /api/admin/users - Create admin user
export const POST = withAdmin(async (req: NextRequest, _user: JWTPayload) => {
  try {
    const body = await req.json();
    const validation = createAdminSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password, name, phone, role, permissions } = validation.data;

    // Check if user already exists
    const existingUser = await userQueries.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await userQueries.create(email, passwordHash, name, phone);

    // Create admin entry
    const adminUser = await adminQueries.create(
      newUser.id,
      role,
      permissions || {}
    );

    return NextResponse.json(
      {
        message: 'Admin user created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          phone: newUser.phone,
          isAdmin: true,
          role: adminUser.role,
          permissions: adminUser.permissions,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create admin user error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
});
