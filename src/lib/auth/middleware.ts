import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeader, AuthError } from './index';
import { adminQueries } from '@/lib/db/queries';
import { JWTPayload } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

export function rateLimit(identifier: string): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitMap.set(identifier, { count: 1, resetTime });
    return { success: true, remaining: RATE_LIMIT_MAX - 1, reset: resetTime };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { success: false, remaining: 0, reset: record.resetTime };
  }

  record.count++;
  return { success: true, remaining: RATE_LIMIT_MAX - record.count, reset: record.resetTime };
}

export function cleanupRateLimitMap() {
  const now = Date.now();
  const entries = Array.from(rateLimitMap.entries());
  for (const [key, value] of entries) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

setInterval(cleanupRateLimitMap, 60000);

export function applyRateLimit(req: NextRequest): NextResponse | null {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const identifier = `${ip}-${req.nextUrl.pathname}`;
  
  const { success, reset } = rateLimit(identifier);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

export async function verifyAuth(req: NextRequest): Promise<JWTPayload | null> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const rateLimitResponse = applyRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const user = await verifyAuth(req);

    if (!user) {
      throw new AuthError('Unauthorized. Please login to continue.', 401);
    }

    return await handler(req, user);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function requireAdmin(
  req: NextRequest,
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const rateLimitResponse = applyRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const user = await verifyAuth(req);

    if (!user) {
      throw new AuthError('Unauthorized. Please login to continue.', 401);
    }

    const isAdmin = await adminQueries.isAdmin(user.userId);

    if (!isAdmin) {
      throw new AuthError('Forbidden. Admin access required.', 403);
    }

    return await handler(req, { ...user, isAdmin: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error('Admin middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export function withAuth(
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    return requireAuth(req, handler);
  };
}

export function withAdmin(
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    return requireAdmin(req, handler);
  };
}

export function createAuthResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}
