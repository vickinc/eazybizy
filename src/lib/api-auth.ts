import { NextRequest, NextResponse } from 'next/server';
import { serverAuthService } from '@/services/auth/authService.server';
import { cookies } from 'next/headers';
import { User } from '@/types';

export async function authenticateRequest(): Promise<{ user: User | null; error?: NextResponse }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return {
        user: null,
        error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      };
    }

    const user = await serverAuthService.getCurrentUserFromToken(token);

    if (!user) {
      return {
        user: null,
        error: NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      };
    }

    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    };
  }
}