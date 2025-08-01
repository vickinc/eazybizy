import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { AutoGeneratedEventSyncService } from '@/services/business/autoGeneratedEventSyncService';

// DELETE /api/calendar/auto-generated/delete - Delete an anniversary event
export async function DELETE(request: NextRequest) {
  try {
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { eventId } = await request.json();
    
    console.log('DEBUG: Deleting anniversary event:', { eventId, userEmail: currentUser.email });

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Get user from database
    const { prisma } = require('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { id: true, timezoneId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await AutoGeneratedEventSyncService.deleteAnniversaryEvent(
      eventId,
      user.id,
      user.timezoneId || 'UTC'
    );

    if (result.deleted) {
      // Invalidate dashboard cache to reflect immediate changes
      try {
        const { CacheService } = await import('@/lib/redis');
        await CacheService.del('dashboard:summary');
        console.log('Dashboard cache invalidated after auto-generated event deletion');
      } catch (cacheError) {
        console.warn('Failed to invalidate dashboard cache:', cacheError);
      }
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error || 'Failed to delete event' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting anniversary event:', error);
    return NextResponse.json(
      { error: 'Failed to delete anniversary event' },
      { status: 500 }
    );
  }
}