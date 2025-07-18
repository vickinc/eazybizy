import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { GoogleCalendarService } from '@/services/integration/googleCalendarService';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

// Rate limiting for sync operations
const syncLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Limit each IP to 500 requests per minute
});

// Manual sync trigger
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    try {
      await syncLimiter.check(request, 5, 'SYNC_CACHE'); // 5 requests per minute per IP
    } catch {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { id: true, googleSyncEnabled: true, timezoneId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.googleSyncEnabled) {
      return NextResponse.json({ error: 'Google Calendar sync not enabled' }, { status: 400 });
    }

    const { calendarId } = await request.json();
    
    console.log('Initializing Google Calendar sync for user:', user.id);
    const googleCalendarService = new GoogleCalendarService(user.id, user.timezoneId);
    
    console.log('Starting unified sync with calendarId:', calendarId || 'primary');
    const syncResult = await googleCalendarService.unifiedSync({
      calendarId: calendarId || 'primary',
      syncType: 'all',
      includeAnniversaryEvents: true
    });
    
    console.log('Sync completed:', syncResult);
    console.log('Sync errors (if any):', syncResult.errors);
    
    // Invalidate dashboard cache after sync to ensure fresh data
    try {
      const { CacheService } = await import('@/lib/redis');
      await CacheService.del('dashboard:summary');
      console.log('Dashboard cache invalidated after sync');
    } catch (cacheError) {
      console.warn('Failed to invalidate dashboard cache:', cacheError);
    }
    
    return NextResponse.json({
      success: true,
      pushed: syncResult.pushed,
      pulled: syncResult.pulled,
      deleted: syncResult.deleted,
      errors: syncResult.errors || [],
      syncType: syncResult.syncType
    });
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync with Google Calendar' },
      { status: 500 }
    );
  }
}

// Get sync status
export async function GET(request: NextRequest) {
  try {
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: {
        id: true,
        googleSyncEnabled: true,
        lastGoogleSync: true,
        googleEmail: true,
        timezoneId: true,
        timezoneMode: true,
        googleCalendarId: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get Google Calendar timezone if sync is enabled
    let googleTimezone = null;
    if (user.googleSyncEnabled) {
      try {
        const googleCalendarService = new GoogleCalendarService(user.id, user.timezoneId);
        googleTimezone = await googleCalendarService.getCalendarTimezone(user.googleCalendarId || 'primary');
      } catch (error) {
        console.error('Error getting Google Calendar timezone:', error);
      }
    }

    // Get recent sync logs
    const recentSyncs = await prisma.googleCalendarSync.findMany({
      where: { userId: user.id },
      orderBy: { syncedAt: 'desc' },
      take: 10,
      select: {
        syncType: true,
        syncStatus: true,
        errorMessage: true,
        syncedAt: true
      }
    });

    // Get sync statistics
    const syncStats = await prisma.googleCalendarSync.groupBy({
      by: ['syncStatus'],
      where: {
        userId: user.id,
        syncedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      _count: true
    });

    return NextResponse.json({
      googleSyncEnabled: user.googleSyncEnabled,
      lastGoogleSync: user.lastGoogleSync,
      googleEmail: user.googleEmail,
      timezoneId: user.timezoneId,
      timezoneMode: user.timezoneMode,
      googleTimezone,
      recentSyncs,
      syncStats: syncStats.reduce((acc, stat) => {
        acc[stat.syncStatus] = stat._count;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}