import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { AutoGeneratedEventSyncService } from '@/services/business/autoGeneratedEventSyncService';

// POST /api/calendar/auto-generated/sync - Auto-sync anniversary events
export async function POST(request: NextRequest) {
  try {
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { events } = await request.json();

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Events array is required' }, { status: 400 });
    }

    // Get user from database
    const { prisma } = require('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { id: true, timezoneId: true, googleSyncEnabled: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.googleSyncEnabled) {
      return NextResponse.json({ error: 'Google Calendar sync not enabled' }, { status: 400 });
    }

    const result = await AutoGeneratedEventSyncService.batchAutoSyncAnniversaryEvents(
      events,
      user.id,
      user.timezoneId || 'UTC'
    );

    return NextResponse.json({
      success: true,
      syncedCount: result.syncedCount,
      errors: result.errors
    });
  } catch (error) {
    console.error('Error auto-syncing anniversary events:', error);
    return NextResponse.json(
      { error: 'Failed to auto-sync anniversary events' },
      { status: 500 }
    );
  }
}