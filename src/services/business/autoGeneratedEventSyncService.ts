/**
 * Service for managing auto-generated event syncing with Google Calendar
 */

import { prisma } from '@/lib/prisma';
import { GoogleCalendarService } from '@/services/integration/googleCalendarService';
import { CalendarEvent } from '@/types/calendar.types';

export interface AutoGeneratedEventSync {
  id: string;
  originalEventId: string; // The anniversary event ID (e.g., "anniversary-1-2026")
  googleEventId: string;
  userId: string;
  title: string;
  date: Date;
  syncedAt: Date;
}

export class AutoGeneratedEventSyncService {
  
  /**
   * Auto-sync an anniversary event to Google Calendar if not already synced
   */
  static async autoSyncAnniversaryEvent(
    event: CalendarEvent, 
    userId: string, 
    userTimezone: string = 'UTC'
  ): Promise<{ synced: boolean; googleEventId?: string; error?: string }> {
    try {
      // Check if this anniversary event is already synced
      const existingSync = await prisma.autoGeneratedEventSync.findFirst({
        where: {
          originalEventId: event.id,
          userId: userId
        }
      });

      if (existingSync) {
        return { synced: false, googleEventId: existingSync.googleEventId };
      }

      // Check if user has Google Calendar sync enabled
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { googleSyncEnabled: true, googleDefaultCalendarId: true }
      });

      if (!user?.googleSyncEnabled) {
        return { synced: false, error: 'Google Calendar sync not enabled' };
      }

      // Sync to Google Calendar
      const googleCalendarService = new GoogleCalendarService(userId, userTimezone);
      const syncResult = await googleCalendarService.pushEventToGoogle(
        event, 
        user.googleDefaultCalendarId || 'primary'
      );

      if (syncResult.success && syncResult.eventId) {
        // Create a tracking record
        await prisma.autoGeneratedEventSync.create({
          data: {
            originalEventId: event.id,
            googleEventId: syncResult.eventId,
            userId: userId,
            title: event.title,
            date: event.date,
            syncedAt: new Date()
          }
        });

        return { synced: true, googleEventId: syncResult.eventId };
      } else {
        return { synced: false, error: syncResult.error || 'Unknown sync error' };
      }
    } catch (error) {
      console.error('Auto-sync anniversary event failed:', error);
      return { synced: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Delete an auto-generated event from both tracking and Google Calendar
   */
  static async deleteAnniversaryEvent(
    originalEventId: string,
    userId: string,
    userTimezone: string = 'UTC'
  ): Promise<{ deleted: boolean; error?: string }> {
    try {
      console.log('DEBUG: deleteAnniversaryEvent called with:', { originalEventId, userId, userTimezone });
      // Find the sync record
      const syncRecord = await prisma.autoGeneratedEventSync.findFirst({
        where: {
          originalEventId: originalEventId,
          userId: userId
        }
      });

      if (!syncRecord) {
        // Event was never synced, just mark as deleted locally
        console.log('DEBUG: Event not found in sync records, creating deletion marker');
        await prisma.autoGeneratedEventSync.create({
          data: {
            originalEventId: originalEventId,
            googleEventId: '', // Empty for deletion marker
            userId: userId,
            title: `DELETED_${originalEventId}`,
            date: new Date(),
            syncedAt: new Date(),
            isDeleted: true
          }
        });
        console.log('DEBUG: Deletion marker created successfully');
        return { deleted: true };
      }

      // Delete from Google Calendar if it has a Google event ID
      if (syncRecord.googleEventId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { googleSyncEnabled: true, googleDefaultCalendarId: true }
        });

        if (user?.googleSyncEnabled) {
          const googleCalendarService = new GoogleCalendarService(userId, userTimezone);
          const deleteResult = await googleCalendarService.deleteEvent(
            user.googleDefaultCalendarId || 'primary',
            syncRecord.googleEventId
          );

          if (!deleteResult.success) {
            console.warn('Failed to delete from Google Calendar:', deleteResult.error);
          }
        }
      }

      // Mark as deleted in our tracking
      await prisma.autoGeneratedEventSync.update({
        where: { id: syncRecord.id },
        data: { isDeleted: true }
      });

      return { deleted: true };
    } catch (error) {
      console.error('Delete anniversary event failed:', error);
      return { deleted: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get all deleted anniversary event IDs for a user
   */
  static async getDeletedAnniversaryEventIds(userId: string): Promise<string[]> {
    try {
      const deletedEvents = await prisma.autoGeneratedEventSync.findMany({
        where: {
          userId: userId,
          isDeleted: true
        },
        select: { originalEventId: true }
      });

      return deletedEvents.map(event => event.originalEventId);
    } catch (error) {
      console.error('Failed to get deleted anniversary events:', error);
      return [];
    }
  }

  /**
   * Check if an anniversary event is deleted
   */
  static async isAnniversaryEventDeleted(originalEventId: string, userId: string): Promise<boolean> {
    try {
      const deletedEvent = await prisma.autoGeneratedEventSync.findFirst({
        where: {
          originalEventId: originalEventId,
          userId: userId,
          isDeleted: true
        }
      });

      return !!deletedEvent;
    } catch (error) {
      console.error('Failed to check if anniversary event is deleted:', error);
      return false;
    }
  }

  /**
   * Auto-sync multiple anniversary events in batch using unified sync
   */
  static async batchAutoSyncAnniversaryEvents(
    userId: string,
    userTimezone: string = 'UTC'
  ): Promise<{ syncedCount: number; errors: string[] }> {
    try {
      // Use the unified sync function for anniversary events
      const googleCalendarService = new GoogleCalendarService(userId, userTimezone);
      const syncResult = await googleCalendarService.unifiedSync({
        syncType: 'auto-generated',
        includeAnniversaryEvents: true
      });

      return {
        syncedCount: syncResult.pushed,
        errors: syncResult.errors
      };
    } catch (error) {
      console.error('Batch auto-sync anniversary events failed:', error);
      return {
        syncedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}