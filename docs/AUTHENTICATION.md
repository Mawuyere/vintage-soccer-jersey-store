# Authentication System Documentation

## Overview

The authentication system for the Vintage Soccer Jersey Store uses NextAuth.js with JWT tokens and bcrypt password hashing. It provides secure user registration, login, email verification, and password reset functionality.

## Architecture

### Core Components

1. **Authentication Utilities** (`src/lib/auth/index.ts`)
   - Password hashing and comparison using bcrypt (10 rounds)
   - JWT token generation and verification
   - Email and password validation
   - Session user management

2. **Authentication Middleware** (`src/lib/auth/middleware.ts`)
   - Rate limiting for API endpoints
   - Token verification
   - Protected route handlers (`requireAuth`, `requireAdmin`)
   - Helper functions for route protection

3. **NextAuth.js Configuration** (`src/app/api/auth/[...nextauth]/route.ts`)
   - Credentials provider setup
   - JWT session strategy
   - Custom callbacks for user and session data

4. **API Endpoints**
   - `/api/auth/register` - User registration
   - `/api/auth/verify-email` - Email verification
   - `/api/auth/forgot-password` - Password reset request
   - `/api/auth/reset-password` - Password reset
   - `/api/auth/[...nextauth]` - NextAuth.js routes (signin, signout, session)

## Security Features

### Password Security
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Hashed using bcrypt with 10 rounds

### JWT Tokens
- 7-day expiration for access tokens
- 30-day expiration for refresh tokens
- Signed with secret from environment variables

### Rate Limiting
- Configurable via environment variables
- Default: 100 requests per 15 minutes per IP
- Applies to all authentication endpoints

### Email Verification
- Required before login
- 24-hour token expiration
- Secure token generation using JWT

### Password Reset
- 1-hour token expiration
- Tokens invalidated after use
- Security best practice: same response for existing/non-existing emails

## Environment Variables

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret-key-here

# Security
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## API Usage

### User Registration

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "isAdmin": false
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "verificationRequired": true
}
```

### Email Verification

**Endpoint:** `GET /api/auth/verify-email?token=<token>`

Redirects to login page on success.

**Alternative:** `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "token": "verification-token-here"
}
```

### Login (NextAuth.js)

**Endpoint:** `POST /api/auth/signin`

Use NextAuth.js client methods:

```typescript
import { signIn } from 'next-auth/react';

const result = await signIn('credentials', {
  email: 'user@example.com',
  password: 'SecurePass123',
  redirect: false,
});
```

### Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-here",
  "password": "NewSecurePass123"
}
```

## Protected Routes

### Using Middleware Helpers

```typescript
import { withAuth, withAdmin } from '@/lib/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Protected route (any authenticated user)
export const GET = withAuth(async (req: NextRequest, user) => {
  return NextResponse.json({ 
    message: 'Protected data',
    userId: user.userId 
  });
});

// Admin-only route
export const POST = withAdmin(async (req: NextRequest, user) => {
  return NextResponse.json({ 
    message: 'Admin action completed',
    adminId: user.userId 
  });
});
```

### Manual Authentication Check

```typescript
import { verifyAuth } from '@/lib/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Handle authenticated request
  return NextResponse.json({ data: 'protected' });
}
```

## Client-Side Usage

### Get Session

```typescript
import { useSession } from 'next-auth/react';

function ProfilePage() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') return <div>Not logged in</div>;
  
  return <div>Welcome {session?.user?.name}</div>;
}
```

### Protected Page

```typescript
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function ProtectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);
  
  if (status === 'loading') return <div>Loading...</div>;
  
  return <div>Protected content</div>;
}
```

## Role-Based Access Control

### Admin Check

The system automatically checks for admin status during authentication:

1. User logs in with credentials
2. System queries `admin_users` table
3. `isAdmin` flag is set in JWT token and session
4. Use `requireAdmin` middleware for admin-only routes

### Example Admin Route

```typescript
import { withAdmin } from '@/lib/auth/middleware';

export const POST = withAdmin(async (req, user) => {
  // Only admins can access this
  // user.isAdmin will be true
  return NextResponse.json({ message: 'Admin action' });
});
```

## Error Handling

All authentication endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `409` - Conflict (user already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

Rate limiting is applied per IP address and endpoint:

**Response Headers:**
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining in window
- `X-RateLimit-Reset` - Timestamp when limit resets
- `Retry-After` - Seconds to wait before retrying (429 only)

## Database Schema Requirements

The authentication system requires these database tables:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  reset_password_token TEXT,
  reset_password_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin users table
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'admin',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing

### Manual Testing

1. **Registration Flow:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123456","name":"Test User"}'
   ```

2. **Email Verification:**
   ```bash
   curl http://localhost:3000/api/auth/verify-email?token=<token>
   ```

3. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123456"}'
   ```

4. **Forgot Password:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

5. **Reset Password:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token":"<reset-token>","password":"NewTest123456"}'
   ```

## Best Practices

1. **Always use HTTPS in production**
2. **Store JWT_SECRET and NEXTAUTH_SECRET securely**
3. **Implement email sending for verification and password reset**
4. **Configure proper CORS settings**
5. **Monitor rate limit violations**
6. **Regularly rotate secrets**
7. **Use strong password requirements**
8. **Log authentication failures for security monitoring**
9. **Implement account lockout after multiple failed attempts**
10. **Add 2FA for admin accounts**

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Social authentication providers (Google, Facebook)
- [ ] Account lockout after failed login attempts
- [ ] Session management (view active sessions, logout all devices)
- [ ] Email notification service integration
- [ ] Audit log for authentication events
- [ ] Password history to prevent reuse
- [ ] Remember me functionality
- [ ] Device fingerprinting
- [ ] Geographic login restrictions
