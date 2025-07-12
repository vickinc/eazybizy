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
      // For auto-generated events, we need to generate anniversary events and sync them
      const companies = await prisma.company.findMany({
        select: {
          id: true,
          tradingName: true,
          registrationDate: true,
          status: true
        }
      });

      // Generate anniversary events for the next year
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const endDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());
      
      // Import the anniversary service
      const { CompanyAnniversaryService } = await import('@/services/business/companyAnniversaryService');
      const anniversaryEvents = CompanyAnniversaryService.generateAnniversaryEventsForCompanies(
        companies,
        startDate,
        endDate
      );

      let syncedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      console.log(`Found ${anniversaryEvents.length} anniversary events to sync`);

      // Get existing events from Google Calendar to avoid duplicates
      const existingGoogleEvents = await googleCalendarService.listEvents(
        targetCalendarId || 'primary',
        startDate,
        endDate
      );

      for (const anniversaryEvent of anniversaryEvents) {
        try {
          // Convert anniversary event to calendar event format
          const calendarEvent = CompanyAnniversaryService.convertToCalendarEvent(anniversaryEvent);
          
          // Check if this event already exists in Google Calendar
          const eventTitle = `Company Event: ${calendarEvent.title}`;
          const eventDate = calendarEvent.date.toISOString().split('T')[0];
          
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
          
          console.log(`Syncing anniversary event: ${calendarEvent.title}`);
          
          // Initialize auth before creating event
          await googleCalendarService.initializeAuth();
          
          // Convert to Google event format and create directly
          const googleEventData = {
            summary: `Company Event: ${calendarEvent.title}`,
            description: calendarEvent.description,
            start: {
              dateTime: `${calendarEvent.date.toISOString().split('T')[0]}T${calendarEvent.time}:00`,
              timeZone: user.timezoneId || 'UTC'
            },
            end: {
              dateTime: `${calendarEvent.date.toISOString().split('T')[0]}T${calendarEvent.time}:00`,
              timeZone: user.timezoneId || 'UTC'
            }
          };
          
          const result = await googleCalendarService.createEvent(targetCalendarId || 'primary', googleEventData);
          
          if (result.success) {
            syncedCount++;
            console.log(`Successfully synced: ${calendarEvent.title}`);
          } else {
            errors.push(`Event "${calendarEvent.title}": ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error(`Failed to sync anniversary event:`, error);
          errors.push(`Anniversary event: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return NextResponse.json({
        success: true,
        synced: syncedCount,
        skipped: skippedCount,
        total: anniversaryEvents.length,
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