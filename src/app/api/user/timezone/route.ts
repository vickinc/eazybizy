import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { isValidTimezone } from '@/lib/timezone';

export async function POST(request: NextRequest) {
  try {
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { timezoneId } = await request.json();
    
    if (!timezoneId || !isValidTimezone(timezoneId)) {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { timezoneId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating timezone:', error);
    return NextResponse.json(
      { error: 'Failed to update timezone' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { timezoneId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ timezoneId: user.timezoneId });
  } catch (error) {
    console.error('Error fetching timezone:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timezone' },
      { status: 500 }
    );
  }
}