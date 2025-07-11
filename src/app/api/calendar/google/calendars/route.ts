import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { GoogleCalendarService } from '@/services/integration/googleCalendarService';
import { prisma } from '@/lib/prisma';

// Get user's Google calendars
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
        timezoneId: true,
        googleCalendarId: true 
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.googleSyncEnabled) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    const googleCalendarService = new GoogleCalendarService(user.id, user.timezoneId);
    const calendars = await googleCalendarService.listCalendars();

    return NextResponse.json({
      calendars: calendars.map(calendar => ({
        id: calendar.id,
        summary: calendar.summary,
        description: calendar.description,
        primary: calendar.primary,
        selected: calendar.id === user.googleCalendarId,
        accessRole: calendar.accessRole,
        colorId: calendar.colorId,
        backgroundColor: calendar.backgroundColor,
        foregroundColor: calendar.foregroundColor
      }))
    });
  } catch (error) {
    console.error('Error fetching Google calendars:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google calendars' },
      { status: 500 }
    );
  }
}

// Set primary calendar for sync
export async function POST(request: NextRequest) {
  try {
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { calendarId } = await request.json();
    
    if (!calendarId) {
      return NextResponse.json({ error: 'Calendar ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { id: true, googleSyncEnabled: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.googleSyncEnabled) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // Update user's primary calendar
    await prisma.user.update({
      where: { id: user.id },
      data: { googleCalendarId: calendarId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting primary calendar:', error);
    return NextResponse.json(
      { error: 'Failed to set primary calendar' },
      { status: 500 }
    );
  }
}