import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { GoogleCalendarService } from '@/services/integration/googleCalendarService';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

// Rate limiting for bulk sync operations
const bulkSyncLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100, // Limit each IP to 100 requests per minute
});

// Bulk sync events
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    try {
      await bulkSyncLimiter.check(request, 2, 'BULK_SYNC_CACHE'); // 2 requests per minute per IP
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

    const { syncType, targetCalendarId } = await request.json();
    
    if (!syncType || !['all', 'auto-generated'].includes(syncType)) {
      return NextResponse.json({ error: 'Invalid sync type. Must be "all" or "auto-generated"' }, { status: 400 });
    }

    console.log('Initializing bulk Google Calendar sync for user:', user.id, 'syncType:', syncType);
    const googleCalendarService = new GoogleCalendarService(user.id, user.timezoneId);
    
    // Use the unified sync function for both sync types
    const syncResult = await googleCalendarService.unifiedSync({
      calendarId: targetCalendarId || 'primary',
      syncType: syncType as 'all' | 'auto-generated',
      includeAnniversaryEvents: true
    });
    
    // Invalidate dashboard cache after sync to ensure fresh data
    try {
      const { CacheService } = await import('@/lib/redis');
      await CacheService.del('dashboard:summary');
      console.log('Dashboard cache invalidated after bulk sync');
    } catch (cacheError) {
      console.warn('Failed to invalidate dashboard cache:', cacheError);
    }
    
    return NextResponse.json({
      success: true,
      synced: syncResult.pushed + syncResult.pulled,
      pushed: syncResult.pushed,
      pulled: syncResult.pulled,
      deleted: syncResult.deleted,
      errors: syncResult.errors,
      syncType: syncResult.syncType
    });
  } catch (error) {
    console.error('Bulk Google Calendar sync error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk sync with Google Calendar' },
      { status: 500 }
    );
  }
}