import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService';

// GET /api/calendar/events - Get all calendar events with basic pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    // Handle company filtering - save for later to properly combine with search OR clause
    let companyFilter: any = null;
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
    let searchFilter: any = null;
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
    const body = await request.json();
    const {
      title,
      description = '',
      date,
      time,
      type = 'OTHER',
      priority = 'MEDIUM',
      company,
      participants = [],
      companyId
    } = body;

    // Validate required fields
    if (!title || !date || !time) {
      return NextResponse.json(
        { error: 'Title, date, and time are required' },
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

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        date: eventDate,
        time,
        type: type.toUpperCase(),
        priority: priority.toUpperCase(),
        company,
        participants: JSON.stringify(participants),
        companyId: companyId ? parseInt(companyId) : null
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
    
    // Also invalidate company-related caches if this event is linked to a company
    if (companyId) {
      await CacheInvalidationService.invalidateOnCompanyMutation(companyId);
    }

    return NextResponse.json({
      ...event,
      participants: event.participants ? JSON.parse(event.participants) : []
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    console.error('Request body:', body);
    return NextResponse.json(
      { 
        error: 'Failed to create calendar event',
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
}