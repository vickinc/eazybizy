import { prisma } from '@/lib/prisma';
import { decrypt, encrypt } from '@/lib/crypto';
import { CalendarEvent, SyncStatus, SyncType } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('Google OAuth credentials not configured');
}

// Dynamic import types for googleapis
type GoogleAuth = any;
type CalendarV3 = any;

interface GoogleCalendarEventData {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  recurrence?: string[];
  attendees?: Array<{ email: string }>;
}

interface SyncResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

export class GoogleCalendarService {
  private oauth2Client: any;
  private calendar: CalendarV3;
  private userId: string;
  private userTimezone: string;
  private googleLibrary: any;
  private initialized = false;

  constructor(userId: string, userTimezone = 'UTC') {
    this.userId = userId;
    this.userTimezone = userTimezone;
  }

  private async initializeGoogleLibrary() {
    if (!this.initialized) {
      const { google } = await import('googleapis');
      this.googleLibrary = google;
      this.oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      this.initialized = true;
    }
  }

  async initializeAuth(): Promise<void> {
    console.log('GoogleCalendarService: Initializing Google library...');
    await this.initializeGoogleLibrary();
    
    console.log('GoogleCalendarService: Looking up user tokens for user:', this.userId);
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        timezoneId: true
      }
    });

    if (!user?.googleAccessToken || !user?.googleRefreshToken) {
      console.error('GoogleCalendarService: No Google tokens found for user');
      throw new Error('Google Calendar not connected for this user');
    }

    console.log('GoogleCalendarService: Found user tokens, setting timezone:', user.timezoneId);
    this.userTimezone = user.timezoneId || 'UTC';

    console.log('GoogleCalendarService: Decrypting tokens...');
    const accessToken = decrypt(user.googleAccessToken);
    const refreshToken = decrypt(user.googleRefreshToken);
    console.log('GoogleCalendarService: Tokens decrypted successfully');

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: user.googleTokenExpiry?.getTime()
    });

    // Check if token needs refresh
    const now = new Date();
    console.log('GoogleCalendarService: Checking token expiry:', { 
      expiry: user.googleTokenExpiry, 
      now, 
      needsRefresh: user.googleTokenExpiry && user.googleTokenExpiry < now 
    });
    
    if (user.googleTokenExpiry && user.googleTokenExpiry < now) {
      console.log('GoogleCalendarService: Token expired, refreshing...');
      await this.refreshTokens();
    }
  }

  private async refreshTokens(): Promise<void> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);

      // Update stored tokens
      if (credentials.access_token) {
        await prisma.user.update({
          where: { id: this.userId },
          data: {
            googleAccessToken: encrypt(credentials.access_token),
            googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null
          }
        });
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh Google Calendar tokens');
    }
  }

  async listCalendars(): Promise<any[]> {
    await this.initializeAuth();
    
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Error listing calendars:', error);
      throw new Error('Failed to list Google Calendars');
    }
  }

  async getCalendarTimezone(calendarId: string = 'primary'): Promise<string | null> {
    await this.initializeAuth();
    
    try {
      const response = await this.calendar.calendars.get({ calendarId });
      return response.data.timeZone || null;
    } catch (error) {
      console.error('Error getting calendar timezone:', error);
      return null;
    }
  }

  async listEvents(calendarId: string = 'primary', timeMin?: Date, timeMax?: Date): Promise<any[]> {
    await this.initializeAuth();
    
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });
      
      return response.data.items || [];
    } catch (error) {
      console.error('Error listing events:', error);
      throw new Error('Failed to list Google Calendar events');
    }
  }

  async createEvent(calendarId: string = 'primary', eventData: GoogleCalendarEventData): Promise<SyncResult> {
    await this.initializeAuth();
    
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: eventData
      });
      
      return {
        success: true,
        eventId: response.data.id
      };
    } catch (error) {
      console.error('Error creating event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateEvent(calendarId: string = 'primary', eventId: string, eventData: GoogleCalendarEventData): Promise<SyncResult> {
    await this.initializeAuth();
    
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: eventData
      });
      
      return {
        success: true,
        eventId: response.data.id
      };
    } catch (error) {
      console.error('Error updating event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteEvent(calendarId: string = 'primary', eventId: string): Promise<SyncResult> {
    await this.initializeAuth();
    
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Convert local CalendarEvent to Google Calendar format
  private convertToGoogleEvent(event: CalendarEvent): GoogleCalendarEventData {
    const startDateTime = this.combineDateTime(event.date, event.time);
    const endDateTime = this.combineDateTime(event.date, event.endTime || event.time);
    
    // Ensure eventScope defaults to 'personal' if null/undefined
    const eventScope = event.eventScope || 'personal';
    
    return {
      id: event.googleEventId || undefined,
      summary: (event.type === 'ANNIVERSARY' || event.type === 'anniversary') 
        ? event.title  // Keep original title for anniversary events
        : (eventScope === 'company' 
          ? `Company Event${event.company ? ` (${event.company})` : ''}: ${event.title}`
          : `Personal Event: ${event.title}`),
      description: event.description,
      start: event.isAllDay ? {
        date: formatInTimeZone(event.date, this.userTimezone, 'yyyy-MM-dd'),
        timeZone: this.userTimezone
      } : {
        dateTime: formatInTimeZone(startDateTime, this.userTimezone, "yyyy-MM-dd'T'HH:mm:ss"),
        timeZone: this.userTimezone
      },
      end: event.isAllDay ? {
        date: formatInTimeZone(event.date, this.userTimezone, 'yyyy-MM-dd'),
        timeZone: this.userTimezone
      } : {
        dateTime: formatInTimeZone(endDateTime, this.userTimezone, "yyyy-MM-dd'T'HH:mm:ss"),
        timeZone: this.userTimezone
      },
      location: event.location,
      recurrence: event.recurrence ? [event.recurrence] : undefined,
      attendees: event.participants ? 
        this.parseParticipants(event.participants) : undefined
    };
  }

  // Convert Google Calendar event to local format
  private convertFromGoogleEvent(googleEvent: any): Partial<CalendarEvent> {
    const startTime = googleEvent.start?.dateTime || googleEvent.start?.date;
    const endTime = googleEvent.end?.dateTime || googleEvent.end?.date;
    
    if (!startTime) {
      throw new Error('Event start time is required');
    }

    const startDate = new Date(startTime);
    const isAllDay = !googleEvent.start?.dateTime;
    
    return {
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description || '',
      date: startDate,
      time: isAllDay ? '00:00' : formatInTimeZone(startDate, this.userTimezone, 'HH:mm'),
      endTime: endTime ? formatInTimeZone(new Date(endTime), this.userTimezone, 'HH:mm') : undefined,
      location: googleEvent.location,
      isAllDay,
      participants: googleEvent.attendees ? 
        JSON.stringify(googleEvent.attendees.map(a => a.email).filter(Boolean)) : '[]',
      recurrence: googleEvent.recurrence ? googleEvent.recurrence[0] : null,
      googleEventId: googleEvent.id,
      googleCalendarId: 'primary', // Default calendar
      googleEtag: googleEvent.etag,
      syncStatus: 'SYNCED',
      lastSyncedAt: new Date()
    };
  }

  // Push local event to Google Calendar
  async pushEventToGoogle(event: CalendarEvent, calendarId: string = 'primary'): Promise<SyncResult> {
    try {
      const googleEventData = this.convertToGoogleEvent(event);
      
      if (event.googleEventId) {
        // Update existing event
        return await this.updateEvent(calendarId, event.googleEventId, googleEventData);
      } else {
        // Create new event
        return await this.createEvent(calendarId, googleEventData);
      }
    } catch (error) {
      console.error('Error pushing event to Google:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Pull events from Google Calendar
  async pullEventsFromGoogle(calendarId: string = 'primary', timeMin?: Date, timeMax?: Date): Promise<Partial<CalendarEvent>[]> {
    try {
      const googleEvents = await this.listEvents(calendarId, timeMin, timeMax);
      return googleEvents.map(event => this.convertFromGoogleEvent(event));
    } catch (error) {
      console.error('Error pulling events from Google:', error);
      throw error;
    }
  }

  // Unified sync function that handles all types of sync operations
  async unifiedSync(options: {
    calendarId?: string;
    syncType?: 'all' | 'regular' | 'auto-generated';
    timeMin?: Date;
    timeMax?: Date;
    includeAnniversaryEvents?: boolean;
  } = {}): Promise<{
    pushed: number;
    pulled: number;
    deleted: number;
    errors: string[];
    syncType: string;
  }> {
    const {
      calendarId = 'primary',
      syncType = 'all',
      timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
      timeMax = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // Default: next 180 days
      includeAnniversaryEvents = true
    } = options;

    const result = { pushed: 0, pulled: 0, deleted: 0, errors: [], syncType };
    
    try {
      console.log('GoogleCalendarService: Starting unified sync for user:', this.userId, 'syncType:', syncType);
      
      // === INITIALIZATION PHASE ===
      try {
        console.log('GoogleCalendarService: Initializing auth...');
        await this.initializeAuth();
        console.log('GoogleCalendarService: Auth initialized successfully');
      } catch (authError) {
        console.error('GoogleCalendarService: Auth initialization failed:', authError);
        const errorMessage = authError instanceof Error ? authError.message : String(authError);
        result.errors.push(`Authentication error: ${errorMessage}`);
        return result; // Return early if auth fails
      }
      
      // === PUSH PHASE ===
      try {
        console.log('GoogleCalendarService: Starting push phase...');
        await this.pushEventsToGoogle(result, calendarId, syncType, timeMin, timeMax, includeAnniversaryEvents);
        console.log('GoogleCalendarService: Push phase completed');
      } catch (pushError) {
        console.error('GoogleCalendarService: Push phase failed:', pushError);
        const errorMessage = pushError instanceof Error ? pushError.message : String(pushError);
        result.errors.push(`Push phase error: ${errorMessage}`);
      }
      
      // === PULL PHASE ===
      try {
        console.log('GoogleCalendarService: Starting pull phase...');
        await this.pullEventsFromGoogle_Internal(result, calendarId, timeMin, timeMax);
        console.log('GoogleCalendarService: Pull phase completed');
      } catch (pullError) {
        console.error('GoogleCalendarService: Pull phase failed:', pullError);
        const errorMessage = pullError instanceof Error ? pullError.message : String(pullError);
        result.errors.push(`Pull phase error: ${errorMessage}`);
      }
      
      // === CLEANUP PHASE ===
      try {
        console.log('GoogleCalendarService: Starting cleanup phase...');
        await this.cleanupDeletedEvents(result, calendarId, timeMin, timeMax);
        console.log('GoogleCalendarService: Cleanup phase completed');
      } catch (cleanupError) {
        console.error('GoogleCalendarService: Cleanup phase failed:', cleanupError);
        const errorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        result.errors.push(`Cleanup phase error: ${errorMessage}`);
      }

      // Update user's last sync time (even if there were some errors)
      try {
        await prisma.user.update({
          where: { id: this.userId },
          data: { lastGoogleSync: new Date() }
        });
        console.log('GoogleCalendarService: Last sync time updated successfully');
      } catch (updateError) {
        console.error('GoogleCalendarService: Failed to update last sync time:', updateError);
        const errorMessage = updateError instanceof Error ? updateError.message : String(updateError);
        result.errors.push(`Failed to update last sync time: ${errorMessage}`);
      }

    } catch (error) {
      console.error('GoogleCalendarService: Unexpected unified sync error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Unexpected sync error: ${errorMessage}`);
    }

    return result;
  }

  // Push events to Google Calendar based on sync type
  private async pushEventsToGoogle(
    result: any,
    calendarId: string,
    syncType: string,
    timeMin: Date,
    timeMax: Date,
    includeAnniversaryEvents: boolean
  ): Promise<void> {
    console.log('GoogleCalendarService: Starting push phase...');
    
    // Get regular database events
    if (syncType === 'all' || syncType === 'regular') {
      const localEvents = await prisma.calendarEvent.findMany({
        where: {
          createdByUserId: this.userId,
          syncStatus: { in: ['LOCAL', 'PENDING'] },
          date: { gte: timeMin, lte: timeMax }
        }
      });
      
      console.log(`GoogleCalendarService: Found ${localEvents.length} regular events to push`);
      
      for (const event of localEvents) {
        try {
          const syncResult = await this.pushEventToGoogle(event, calendarId);
          if (syncResult.success) {
            await prisma.calendarEvent.update({
              where: { id: event.id },
              data: {
                googleEventId: syncResult.eventId,
                googleCalendarId: calendarId,
                syncStatus: 'SYNCED',
                lastSyncedAt: new Date()
              }
            });
            result.pushed++;
          } else {
            result.errors.push(`Failed to push event "${event.title}": ${syncResult.error}`);
          }
        } catch (error) {
          result.errors.push(`Error pushing event "${event.title}": ${error}`);
        }
      }
    }

    // Get and sync anniversary events
    if (includeAnniversaryEvents && (syncType === 'all' || syncType === 'auto-generated')) {
      await this.syncAnniversaryEvents(result, calendarId, timeMin, timeMax);
    }
  }

  // Sync anniversary events specifically
  private async syncAnniversaryEvents(
    result: any,
    calendarId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<void> {
    console.log('GoogleCalendarService: Starting anniversary events sync...');
    
    // Get companies for anniversary generation
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        tradingName: true,
        registrationDate: true,
        status: true
      }
    });

    if (companies.length === 0) {
      console.log('GoogleCalendarService: No companies found for anniversary events');
      return;
    }

    // Generate anniversary events
    const { CompanyAnniversaryService } = await import('@/services/business/companyAnniversaryService');
    const anniversaryEvents = CompanyAnniversaryService.generateAnniversaryEventsForCompanies(
      companies as any[], // Cast to avoid type issues
      timeMin,
      timeMax
    );

    console.log(`GoogleCalendarService: Generated ${anniversaryEvents.length} anniversary events`);

    // Get deleted anniversary event IDs to filter out
    const deletedEventIds = await prisma.autoGeneratedEventSync.findMany({
      where: {
        userId: this.userId,
        isDeleted: true
      },
      select: { originalEventId: true }
    });
    
    const deletedEventIdsSet = new Set(deletedEventIds.map(e => e.originalEventId));

    // Get already synced anniversary events
    const syncedAnniversaryEvents = await prisma.autoGeneratedEventSync.findMany({
      where: {
        userId: this.userId,
        isDeleted: false,
        date: { gte: timeMin, lte: timeMax }
      }
    });
    
    const syncedEventIdsSet = new Set(syncedAnniversaryEvents.map(e => e.originalEventId));

    // Filter and convert events to sync
    const eventsToSync = anniversaryEvents
      .filter(event => !deletedEventIdsSet.has(event.id) && !syncedEventIdsSet.has(event.id))
      .map(event => CompanyAnniversaryService.convertToCalendarEvent(event));

    console.log(`GoogleCalendarService: Found ${eventsToSync.length} new anniversary events to sync`);

    // Sync anniversary events
    for (const event of eventsToSync) {
      try {
        const syncResult = await this.pushEventToGoogle(event as any, calendarId);
        if (syncResult.success && syncResult.eventId) {
          // Create sync tracking record
          await prisma.autoGeneratedEventSync.create({
            data: {
              originalEventId: event.id,
              googleEventId: syncResult.eventId,
              userId: this.userId,
              title: event.title,
              date: event.date,
              syncedAt: new Date()
            }
          });
          result.pushed++;
          console.log(`GoogleCalendarService: Successfully synced anniversary event: ${event.title}`);
        } else {
          result.errors.push(`Failed to sync anniversary event "${event.title}": ${syncResult.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Error syncing anniversary event "${event.title}": ${errorMessage}`);
      }
    }
  }

  // Pull events from Google Calendar (internal method to avoid naming conflicts)
  private async pullEventsFromGoogle_Internal(
    result: any,
    calendarId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<void> {
    console.log('GoogleCalendarService: Starting pull phase...');
    
    try {
      const googleEvents = await this.pullEventsFromGoogle(calendarId, timeMin, timeMax);
      console.log(`GoogleCalendarService: Found ${googleEvents.length} Google events to process`);
      
      // Process events from Google (create or update)
      for (const googleEventData of googleEvents) {
        try {
          if (!googleEventData.googleEventId) {
            console.log('GoogleCalendarService: Skipping event without googleEventId');
            continue;
          }

          // Check if event already exists
          const existingEvent = await prisma.calendarEvent.findFirst({
            where: { googleEventId: googleEventData.googleEventId }
          });

          if (existingEvent) {
            // Update existing event
            await prisma.calendarEvent.update({
              where: { id: existingEvent.id },
              data: {
                ...googleEventData,
                syncStatus: 'SYNCED',
                lastSyncedAt: new Date()
              }
            });
          } else {
            // Create new event
            await prisma.calendarEvent.create({
              data: {
                ...googleEventData,
                createdByUserId: this.userId,
                syncStatus: 'SYNCED',
                lastSyncedAt: new Date(),
                type: 'OTHER',
                priority: 'MEDIUM',
                company: '',
                participants: googleEventData.participants || '[]'
              } as any
            });
            result.pulled++;
          }
        } catch (error) {
          console.error('GoogleCalendarService: Error processing event:', error);
          result.errors.push(`Error pulling event: ${error}`);
        }
      }
    } catch (error) {
      console.error('GoogleCalendarService: Error in pull phase:', error);
      result.errors.push(`Error pulling events: ${error}`);
    }
  }

  // Clean up deleted events
  private async cleanupDeletedEvents(
    result: any,
    calendarId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<void> {
    console.log('GoogleCalendarService: Starting cleanup phase...');
    
    try {
      // Get current Google events to check for deletions
      const googleEvents = await this.pullEventsFromGoogle(calendarId, timeMin, timeMax);
      const currentGoogleEventIds = new Set(
        googleEvents
          .filter(e => e.googleEventId)
          .map(e => e.googleEventId as string)
      );

      // Check for deleted regular events
      const existingSyncedEvents = await prisma.calendarEvent.findMany({
        where: {
          createdByUserId: this.userId,
          googleEventId: { not: null },
          date: { gte: timeMin, lte: timeMax }
        },
        select: { id: true, googleEventId: true, title: true }
      });
      
      for (const localEvent of existingSyncedEvents) {
        if (localEvent.googleEventId && !currentGoogleEventIds.has(localEvent.googleEventId)) {
          try {
            // Log sync activity BEFORE deleting the event
            await this.logSyncActivity(
              localEvent.id,
              'PULL',
              'SYNCED',
              'Event deleted from Google Calendar'
            );
            
            await prisma.calendarEvent.delete({
              where: { id: localEvent.id }
            });
            
            result.deleted++;
          } catch (error) {
            result.errors.push(`Error deleting event "${localEvent.title}": ${error}`);
          }
        }
      }

      // Check for deleted auto-generated events
      const syncedAutoGeneratedEvents = await prisma.autoGeneratedEventSync.findMany({
        where: {
          userId: this.userId,
          isDeleted: false,
          googleEventId: { not: '' },
          date: { gte: timeMin, lte: timeMax }
        }
      });
      
      for (const autoEvent of syncedAutoGeneratedEvents) {
        if (!currentGoogleEventIds.has(autoEvent.googleEventId)) {
          try {
            // Log sync activity BEFORE marking as deleted
            await this.logSyncActivity(
              autoEvent.originalEventId,
              'PULL',
              'SYNCED',
              'Auto-generated event deleted from Google Calendar'
            );
            
            await prisma.autoGeneratedEventSync.update({
              where: { id: autoEvent.id },
              data: { isDeleted: true }
            });
            
            result.deleted++;
          } catch (error) {
            result.errors.push(`Error deleting auto-generated event "${autoEvent.title}": ${error}`);
          }
        }
      }
    } catch (error) {
      console.error('GoogleCalendarService: Error in cleanup phase:', error);
      result.errors.push(`Error in cleanup phase: ${error}`);
    }
  }

  // Legacy method for backward compatibility
  async syncEvents(calendarId: string = 'primary'): Promise<{
    pushed: number;
    pulled: number;
    deleted: number;
    errors: string[];
  }> {
    const result = await this.unifiedSync({
      calendarId,
      syncType: 'all',
      includeAnniversaryEvents: true
    });
    
    return {
      pushed: result.pushed,
      pulled: result.pulled,
      deleted: result.deleted,
      errors: result.errors
    };
  }

  // Utility method to combine date and time with proper timezone handling
  private combineDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create a new date instance and set the time
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    
    // Ensure we're working with the correct timezone
    // The date should be interpreted in the user's timezone
    return combined;
  }

  // Log sync activity
  private async logSyncActivity(eventId: string | null, syncType: string, syncStatus: string, errorMessage?: string) {
    try {
      await prisma.googleCalendarSync.create({
        data: {
          userId: this.userId,
          eventId,
          syncType: syncType as any,
          syncStatus: syncStatus as any,
          errorMessage
        }
      });
    } catch (error) {
      // If foreign key constraint fails (event was deleted), log without eventId
      console.warn('Failed to log sync activity with eventId, retrying without eventId:', error);
      try {
        await prisma.googleCalendarSync.create({
          data: {
            userId: this.userId,
            eventId: null, // Don't reference the deleted event
            syncType: syncType as any,
            syncStatus: syncStatus as any,
            errorMessage: errorMessage || `Sync log for deleted event: ${eventId}`
          }
        });
      } catch (retryError) {
        console.error('Failed to log sync activity even without eventId:', retryError);
      }
    }
  }

  // Safe parse participants JSON
  private parseParticipants(participants: string): Array<{ email: string }> {
    try {
      // Handle empty string or whitespace
      if (!participants || !participants.trim()) {
        return [];
      }
      
      const parsed = JSON.parse(participants);
      
      // Ensure it's an array
      if (!Array.isArray(parsed)) {
        console.warn('Participants is not an array:', parsed);
        return [];
      }
      
      // Map to Google Calendar attendee format
      return parsed
        .filter(email => typeof email === 'string' && email.trim())
        .map(email => ({ email: email.trim() }));
    } catch (error) {
      console.error('Failed to parse participants:', error, 'Raw value:', participants);
      return [];
    }
  }
}