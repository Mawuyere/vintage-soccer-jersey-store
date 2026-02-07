import { NextRequest, NextResponse } from 'next/server';
import { userQueries } from '@/lib/db/queries';
import {
  hashPassword,
  validateEmail,
  validatePassword,
  generateVerificationToken,
  generateToken,
  createSessionUser,
} from '@/lib/auth';
import { applyRateLimit } from '@/lib/auth/middleware';
import { RegisterRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = applyRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body: RegisterRequest = await req.json();
    const { email, password, name, phone } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    const existingUser = await userQueries.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await userQueries.create(email, passwordHash, name, phone);

    const verificationToken = generateVerificationToken();
    await userQueries.setVerificationToken(user.id, verificationToken);

    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}`;

    console.log('Email verification URL:', verificationUrl);

    const sessionUser = createSessionUser({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: false,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: false,
    });

    return NextResponse.json(
      {
        message: 'Registration successful. Please check your email to verify your account.',
        user: sessionUser,
        token,
        verificationRequired: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user. Please try again.' },
      { status: 500 }
    );
  }
}
