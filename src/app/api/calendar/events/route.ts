import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService';
import { authenticateRequest } from '@/lib/api-auth';
import { AnniversaryEventService } from '@/services/business/anniversaryEventService';

// GET /api/calendar/events - Get all calendar events with basic pagination
export async function GET(request: NextRequest) {
  try {
    // Anniversary rollover disabled during page load for performance
    // Rollover will be triggered by dedicated background job or manual trigger
    // Previously caused 6+ second delays on calendar page loads
    // AnniversaryEventService.checkAndGenerateNextAnniversaries().catch(error => {
    //   console.warn('Anniversary rollover check failed during calendar fetch:', error);
    // });

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: unknown = {};
    
    // Handle company filtering - save for later to properly combine with search OR clause
    let companyFilter: unknown = null;
    if (companyId && companyId !== 'all') {
      const companyIdInt = parseInt(companyId);
      const company = await prisma.company.findUnique({
        where: { id: companyIdInt },
        select: { tradingName: true, legalName: true }
      });
      
      if (company) {
        // Match either by companyId or company name string
        companyFilter = {
          OR: [
            { companyId: companyIdInt },
            { company: { in: [company.tradingName, company.legalName] } }
          ]
        };
      } else {
        companyFilter = { companyId: companyIdInt };
      }
    }
    
    if (type && type !== 'all') {
      where.type = type.toUpperCase();
    }
    
    if (priority && priority !== 'all') {
      where.priority = priority.toUpperCase();
    }
    
    // Handle search filtering
    let searchFilter: unknown = null;
    if (search) {
      searchFilter = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } }
        ]
      };
    }
    
    // Combine company and search filters
    if (companyFilter && searchFilter) {
      // Both company and search filters active - combine them with AND
      where.AND = [companyFilter, searchFilter];
    } else if (companyFilter) {
      // Only company filter active
      Object.assign(where, companyFilter);
    } else if (searchFilter) {
      // Only search filter active
      Object.assign(where, searchFilter);
    }

    // Get events with basic include
    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        notes: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        },
        companyRecord: {
          select: {
            id: true,
            legalName: true,
            tradingName: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    });

    // Get total count for pagination
    const total = await prisma.calendarEvent.count({ where });

    return NextResponse.json({
      events: events.map(event => ({
        ...event,
        participants: event.participants ? JSON.parse(event.participants) : []
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

// POST /api/calendar/events - Create new calendar event
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    console.log('Creating calendar event with data:', JSON.stringify(body, null, 2));
    const {
      title,
      description = '',
      date,
      time,
      endTime,
      type = 'OTHER',
      priority = 'MEDIUM',
      company,
      participants = [],
      companyId,
      isAllDay = false,
      location,
      eventScope = 'personal'
    } = body;

    // Validate required fields
    if (!title || !date || !time) {
      return NextResponse.json(
        { error: 'Title, date, and time are required' },
        { status: 400 }
      );
    }

    // Validate company is provided for company events
    if (eventScope === 'company' && !company) {
      return NextResponse.json(
        { error: 'Company is required for company events' },
        { status: 400 }
      );
    }

    // Parse date
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Get user record to set createdByUserId
    const user = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { id: true, googleSyncEnabled: true, timezoneId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        date: eventDate,
        time,
        endTime,
        type: type.toUpperCase(),
        priority: priority.toUpperCase(),
        company,
        participants: JSON.stringify(participants),
        companyId: companyId ? parseInt(companyId) : null,
        isAllDay,
        location,
        createdByUserId: user.id,
        // Set sync status to LOCAL if user has Google Calendar enabled
        syncStatus: user.googleSyncEnabled ? 'LOCAL' : 'NONE',
        timezoneId: user.timezoneId || 'UTC', // Use user's timezone or fallback to UTC
        eventScope: eventScope
      },
      include: {
        notes: true,
        companyRecord: {
          select: {
            id: true,
            legalName: true,
            tradingName: true
          }
        }
      }
    });

    // Invalidate calendar caches after creation
    await CacheInvalidationService.invalidateCalendar();
    
    // Invalidate dashboard cache to reflect immediate changes
    try {
      const { CacheService } = await import('@/lib/redis');
      await CacheService.del('dashboard:summary');
      console.log('Dashboard cache invalidated after event creation');
    } catch (cacheError) {
      console.warn('Failed to invalidate dashboard cache:', cacheError);
    }
    
    // Also invalidate company-related caches if this event is linked to a company
    if (companyId) {
      await CacheInvalidationService.invalidateOnCompanyMutation(companyId);
    }

    // Auto-sync to Google Calendar if user has it enabled
    if (user.googleSyncEnabled && event.syncStatus === 'LOCAL') {
      try {
        console.log('Auto-syncing new event to Google Calendar...');
        const { GoogleCalendarService } = require('@/services/integration/googleCalendarService');
        const googleCalendarService = new GoogleCalendarService(user.id, user.timezoneId || 'UTC');
        const syncResult = await googleCalendarService.pushEventToGoogle(event, 'primary');
        
        if (syncResult.success) {
          // Update the event with Google event ID
          await prisma.calendarEvent.update({
            where: { id: event.id },
            data: {
              googleEventId: syncResult.eventId,
              syncStatus: 'SYNCED',
              lastSyncedAt: new Date()
            }
          });
          console.log('Event auto-synced successfully to Google Calendar');
        }
      } catch (error) {
        console.error('Auto-sync to Google Calendar failed:', error);
        // Don't fail the event creation if sync fails
      }
    }

    return NextResponse.json({
      ...event,
      participants: event.participants ? JSON.parse(event.participants) : []
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Request body:', JSON.stringify(body, null, 2));
    return NextResponse.json(
      { 
        error: 'Failed to create calendar event',
        details: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}