import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService';

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
      type,
      priority,
      company,
      participants,
      companyId
    } = body;

    // Check if event exists
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id }
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
        ...(type !== undefined && { type: type.toUpperCase() }),
        ...(priority !== undefined && { priority: priority.toUpperCase() }),
        ...(company !== undefined && { company }),
        ...(participants !== undefined && { participants: JSON.stringify(participants) }),
        ...(companyId !== undefined && { companyId: companyId ? parseInt(companyId) : null })
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

    // Invalidate calendar caches after update
    await CacheInvalidationService.invalidateCalendar();
    
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

    // Check if event exists
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        notes: true
      }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      );
    }

    // Delete the event (notes will be cascade deleted)
    await prisma.calendarEvent.delete({
      where: { id }
    });

    // Invalidate calendar caches after deletion
    await CacheInvalidationService.invalidateCalendar();
    
    // Also invalidate notes caches since notes are cascade deleted
    await CacheInvalidationService.invalidateNotes();
    
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