import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService';
import { authenticateRequest } from '@/lib/api-auth';

// GET /api/calendar/events/[id] - Get single calendar event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' }
        },
        companyRecord: {
          select: {
            id: true,
            legalName: true,
            tradingName: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...event,
      participants: event.participants ? JSON.parse(event.participants) : []
    });

  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar event' },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/events/[id] - Update calendar event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      title,
      description,
      date,
      time,
      endTime,
      type,
      priority,
      company,
      participants,
      companyId,
      isAllDay,
      location,
      eventScope
    } = body;

    // Authenticate the user
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if event exists and get user info for Google sync
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            googleSyncEnabled: true,
            timezoneId: true,
            googleCalendarId: true
          }
        }
      }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      );
    }

    // Parse date if provided
    let eventDate;
    if (date) {
      eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
    }

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(eventDate && { date: eventDate }),
        ...(time !== undefined && { time }),
        ...(endTime !== undefined && { endTime }),
        ...(type !== undefined && { type: type.toUpperCase() }),
        ...(priority !== undefined && { priority: priority.toUpperCase() }),
        ...(company !== undefined && { company }),
        ...(participants !== undefined && { participants: JSON.stringify(participants) }),
        ...(companyId !== undefined && { companyId: companyId ? parseInt(companyId) : null }),
        ...(isAllDay !== undefined && { isAllDay }),
        ...(location !== undefined && { location }),
        ...(eventScope !== undefined && { eventScope }),
        // Mark as LOCAL for sync if user has Google Calendar enabled
        ...(existingEvent.createdBy?.googleSyncEnabled && { syncStatus: 'LOCAL' })
      },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' }
        },
        companyRecord: {
          select: {
            id: true,
            legalName: true,
            tradingName: true
          }
        }
      }
    });

    // Auto-sync to Google Calendar if user has it enabled and event has Google ID
    if (existingEvent.createdBy?.googleSyncEnabled && existingEvent.googleEventId) {
      try {
        console.log('Auto-syncing updated event to Google Calendar...');
        const { GoogleCalendarService } = require('@/services/integration/googleCalendarService');
        const googleCalendarService = new GoogleCalendarService(
          existingEvent.createdBy.id, 
          existingEvent.createdBy.timezoneId || 'UTC'
        );
        
        const syncResult = await googleCalendarService.pushEventToGoogle(
          updatedEvent,
          existingEvent.createdBy.googleCalendarId || 'primary'
        );
        
        if (syncResult.success) {
          // Update sync status
          await prisma.calendarEvent.update({
            where: { id },
            data: {
              syncStatus: 'SYNCED',
              lastSyncedAt: new Date()
            }
          });
          console.log('Event update synced successfully to Google Calendar');
        }
      } catch (error) {
        console.error('Auto-sync update to Google Calendar failed:', error);
        // Don't fail the update if sync fails
      }
    }

    // Invalidate calendar caches after update
    await CacheInvalidationService.invalidateCalendar();
    
    // Invalidate dashboard cache to reflect immediate changes
    try {
      const { CacheService } = await import('@/lib/redis');
      await CacheService.del('dashboard:summary');
      console.log('Dashboard cache invalidated after event update');
    } catch (cacheError) {
      console.warn('Failed to invalidate dashboard cache:', cacheError);
    }
    
    // Invalidate company-related caches for both old and new company associations
    if (existingEvent.companyId) {
      await CacheInvalidationService.invalidateOnCompanyMutation(existingEvent.companyId);
    }
    if (companyId && companyId !== existingEvent.companyId) {
      await CacheInvalidationService.invalidateOnCompanyMutation(companyId);
    }

    return NextResponse.json({
      ...updatedEvent,
      participants: updatedEvent.participants ? JSON.parse(updatedEvent.participants) : []
    });

  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/events/[id] - Delete calendar event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Authenticate the user
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if event exists and get user info for Google sync
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        notes: true,
        createdBy: {
          select: {
            id: true,
            googleSyncEnabled: true,
            timezoneId: true,
            googleCalendarId: true
          }
        }
      }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      );
    }

    // Try to delete from Google Calendar first if sync is enabled and event has Google ID
    if (existingEvent.createdBy?.googleSyncEnabled && existingEvent.googleEventId) {
      try {
        console.log('Deleting event from Google Calendar:', existingEvent.googleEventId);
        const { GoogleCalendarService } = require('@/services/integration/googleCalendarService');
        const googleCalendarService = new GoogleCalendarService(
          existingEvent.createdBy.id, 
          existingEvent.createdBy.timezoneId || 'UTC'
        );
        
        const deleteResult = await googleCalendarService.deleteEvent(
          existingEvent.createdBy.googleCalendarId || 'primary',
          existingEvent.googleEventId
        );
        
        if (deleteResult.success) {
          console.log('Event successfully deleted from Google Calendar');
          
          // Log successful sync
          await prisma.googleCalendarSync.create({
            data: {
              userId: existingEvent.createdBy.id,
              eventId: existingEvent.id,
              syncType: 'PUSH',
              syncStatus: 'SYNCED'
            }
          });
        } else {
          console.warn('Failed to delete from Google Calendar:', deleteResult.error);
          
          // Log failed sync
          await prisma.googleCalendarSync.create({
            data: {
              userId: existingEvent.createdBy.id,
              eventId: existingEvent.id,
              syncType: 'PUSH',
              syncStatus: 'FAILED',
              errorMessage: deleteResult.error || 'Unknown error'
            }
          });
          // Continue with local deletion even if Google deletion fails
        }
      } catch (error) {
        console.error('Error deleting from Google Calendar:', error);
        // Continue with local deletion even if Google deletion fails
      }
    }

    // Delete the event (notes will be cascade deleted)
    await prisma.calendarEvent.delete({
      where: { id }
    });

    // Invalidate calendar caches after deletion
    await CacheInvalidationService.invalidateCalendar();
    
    // Also invalidate notes caches since notes are cascade deleted
    await CacheInvalidationService.invalidateNotes();
    
    // Invalidate dashboard cache to reflect immediate changes
    try {
      const { CacheService } = await import('@/lib/redis');
      await CacheService.del('dashboard:summary');
      console.log('Dashboard cache invalidated after event deletion');
    } catch (cacheError) {
      console.warn('Failed to invalidate dashboard cache:', cacheError);
    }
    
    // Invalidate company-related caches if this event was linked to a company
    if (existingEvent.companyId) {
      await CacheInvalidationService.invalidateOnCompanyMutation(existingEvent.companyId);
    }

    return NextResponse.json(
      { message: 'Calendar event deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}