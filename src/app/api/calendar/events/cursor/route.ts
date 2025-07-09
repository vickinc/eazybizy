import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CursorData {
  createdAt: string;
  id: string;
}

function parseCursor(cursor: string): CursorData | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

function createCursor(createdAt: Date, id: string): string {
  const cursorData: CursorData = {
    createdAt: createdAt.toISOString(),
    id
  };
  return Buffer.from(JSON.stringify(cursorData), 'utf-8').toString('base64');
}

// GET /api/calendar/events/cursor - Get calendar events with cursor pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' || 'desc';
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

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

    // Date range filtering
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    // Handle cursor pagination
    if (cursor) {
      const cursorData = parseCursor(cursor);
      if (!cursorData) {
        return NextResponse.json(
          { error: 'Invalid cursor format' },
          { status: 400 }
        );
      }

      const cursorCondition = {
        OR: [
          { 
            createdAt: sortDirection === 'desc' 
              ? { lt: new Date(cursorData.createdAt) }
              : { gt: new Date(cursorData.createdAt) }
          },
          { 
            createdAt: new Date(cursorData.createdAt), 
            id: sortDirection === 'desc' 
              ? { lt: cursorData.id }
              : { gt: cursorData.id }
          }
        ]
      };

      where.AND = where.AND ? [...where.AND, cursorCondition] : [cursorCondition];
    }

    // Get events with cursor pagination
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
        { createdAt: sortDirection },
        { id: sortDirection }
      ],
      take: limit + 1 // Get one extra to check if there are more results
    });

    // Check if there are more results
    const hasMore = events.length > limit;
    const actualEvents = hasMore ? events.slice(0, limit) : events;

    // Create next cursor
    let nextCursor: string | null = null;
    if (hasMore && actualEvents.length > 0) {
      const lastEvent = actualEvents[actualEvents.length - 1];
      nextCursor = createCursor(lastEvent.createdAt, lastEvent.id);
    }

    return NextResponse.json({
      events: actualEvents.map(event => ({
        ...event,
        participants: event.participants ? JSON.parse(event.participants) : []
      })),
      pagination: {
        hasMore,
        nextCursor,
        limit,
        count: actualEvents.length
      }
    });

  } catch (error) {
    console.error('Error fetching calendar events with cursor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}