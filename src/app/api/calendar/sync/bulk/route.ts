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
    
    if (syncType === 'all') {
      // Use the existing syncEvents method for full sync
      console.log('Starting full sync for user:', user.id);
      const syncResult = await googleCalendarService.syncEvents(targetCalendarId || 'primary');
      
      return NextResponse.json({
        success: true,
        synced: syncResult.pushed + syncResult.pulled,
        pushed: syncResult.pushed,
        pulled: syncResult.pulled,
        deleted: syncResult.deleted,
        errors: syncResult.errors
      });
    } else {
      // For auto-generated events, prioritize database events with override markers
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const endDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());
      
      // First, get all database events that are anniversary overrides or regular anniversary events
      const databaseAnniversaryEvents = await prisma.calendarEvent.findMany({
        where: {
          createdByUserId: user.id,
          OR: [
            // Events with anniversary override markers in description
            { description: { contains: '[ANNIVERSARY_OVERRIDE:' } },
            // Regular anniversary events
            { type: 'ANNIVERSARY' }
          ],
          date: {
            gte: startDate,
            lte: endDate
          },
          syncStatus: { in: ['LOCAL', 'PENDING'] } // Only sync events that need syncing
        }
      });

      // Generate original anniversary events from companies
      const companies = await prisma.company.findMany({
        select: {
          id: true,
          tradingName: true,
          registrationDate: true,
          status: true
        }
      });

      const { CompanyAnniversaryService } = await import('@/services/business/companyAnniversaryService');
      const originalAnniversaryEvents = CompanyAnniversaryService.generateAnniversaryEventsForCompanies(
        companies,
        startDate,
        endDate
      );

      // Get overridden anniversary IDs from database events
      const overriddenAnniversaryIds = new Set<string>();
      databaseAnniversaryEvents.forEach(event => {
        const overrideMatch = event.description?.match(/\[ANNIVERSARY_OVERRIDE:([^\]]+)\]/);
        if (overrideMatch) {
          overriddenAnniversaryIds.add(overrideMatch[1]);
        }
      });

      // Filter out original anniversary events that have been overridden
      const nonOverriddenAnniversaryEvents = originalAnniversaryEvents.filter(
        event => !overriddenAnniversaryIds.has(event.id)
      );

      // Combine database events and non-overridden anniversary events
      const eventsToSync = [
        ...databaseAnniversaryEvents,
        ...nonOverriddenAnniversaryEvents.map(event => CompanyAnniversaryService.convertToCalendarEvent(event))
      ];

      let syncedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      console.log(`Found ${eventsToSync.length} anniversary events to sync (${databaseAnniversaryEvents.length} database, ${nonOverriddenAnniversaryEvents.length} original)`);

      // Get existing events from Google Calendar to avoid duplicates
      const existingGoogleEvents = await googleCalendarService.listEvents(
        targetCalendarId || 'primary',
        startDate,
        endDate
      );

      for (const eventToSync of eventsToSync) {
        try {
          // Use the event directly if it's already a CalendarEvent (database event)
          // Otherwise convert it from anniversary event format
          const calendarEvent = eventToSync.id ? eventToSync : CompanyAnniversaryService.convertToCalendarEvent(eventToSync);
          
          // Check if this event already exists in Google Calendar
          const eventTitle = (calendarEvent.type === 'ANNIVERSARY' || calendarEvent.type === 'anniversary') 
            ? calendarEvent.title  // Keep original title for anniversary events
            : `Company Event: ${calendarEvent.title}`;
          const eventDate = calendarEvent.date.toISOString().split('T')[0];
          
          // Skip if event already has a googleEventId (already synced)
          if (calendarEvent.googleEventId) {
            console.log(`Skipping already synced event: ${calendarEvent.title}`);
            skippedCount++;
            continue;
          }
          
          const existingEvent = existingGoogleEvents.find(gEvent => {
            const titleMatches = gEvent.summary === eventTitle;
            const dateMatches = gEvent.start?.date === eventDate || 
                               gEvent.start?.dateTime?.startsWith(eventDate);
            
            console.log(`Checking event: "${gEvent.summary}" vs "${eventTitle}"`);
            console.log(`Title matches: ${titleMatches}, Date matches: ${dateMatches}`);
            
            return titleMatches && dateMatches;
          });

          if (existingEvent) {
            console.log(`Skipping duplicate event: ${calendarEvent.title}`);
            skippedCount++;
            continue;
          }
          
          console.log(`Syncing event: ${calendarEvent.title}`);
          
          // Initialize auth before creating event
          await googleCalendarService.initializeAuth();
          
          // For database events, use the proper sync method
          if (calendarEvent.id && calendarEvent.id.length > 20) { // Database events have long IDs
            const result = await googleCalendarService.pushEventToGoogle(calendarEvent, targetCalendarId || 'primary');
            
            if (result.success) {
              // Update the database event with Google event ID
              await prisma.calendarEvent.update({
                where: { id: calendarEvent.id },
                data: {
                  googleEventId: result.eventId,
                  syncStatus: 'SYNCED',
                  lastSyncedAt: new Date()
                }
              });
              syncedCount++;
              console.log(`Successfully synced database event: ${calendarEvent.title}`);
            } else {
              errors.push(`Database event "${calendarEvent.title}": ${result.error || 'Unknown error'}`);
            }
          } else {
            // For anniversary events, use the proper sync method instead of manual creation
            const result = await googleCalendarService.pushEventToGoogle(calendarEvent, targetCalendarId || 'primary');
            
            if (result.success) {
              syncedCount++;
              console.log(`Successfully synced anniversary event: ${calendarEvent.title}`);
            } else {
              errors.push(`Anniversary event "${calendarEvent.title}": ${result.error || 'Unknown error'}`);
            }
          }
        } catch (error) {
          console.error(`Failed to sync event:`, error);
          errors.push(`Event sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return NextResponse.json({
        success: true,
        synced: syncedCount,
        skipped: skippedCount,
        total: eventsToSync.length,
        errors: errors
      });
    }
  } catch (error) {
    console.error('Bulk Google Calendar sync error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk sync with Google Calendar' },
      { status: 500 }
    );
  }
}