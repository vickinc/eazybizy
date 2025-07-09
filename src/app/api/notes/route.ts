import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService';

// GET /api/notes - Get notes with basic pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const eventId = searchParams.get('eventId');
    const companyId = searchParams.get('companyId');
    const priority = searchParams.get('priority');
    const isCompleted = searchParams.get('isCompleted');
    const isStandalone = searchParams.get('isStandalone');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: unknown = {};
    
    if (eventId) {
      where.eventId = eventId;
    }
    
    if (companyId && companyId !== 'all') {
      where.companyId = parseInt(companyId);
    }
    
    if (priority && priority !== 'all') {
      where.priority = priority.toUpperCase();
    }
    
    if (isCompleted !== null && isCompleted !== undefined) {
      where.isCompleted = isCompleted === 'true';
    }
    
    if (isStandalone !== null && isStandalone !== undefined) {
      where.isStandalone = isStandalone === 'true';
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get notes
    const notes = await prisma.note.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true
          }
        },
        company: {
          select: {
            id: true,
            legalName: true,
            tradingName: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    });

    // Get total count for pagination
    const total = await prisma.note.count({ where });

    return NextResponse.json({
      notes: notes.map(note => ({
        ...note,
        tags: note.tags ? JSON.parse(note.tags) : []
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
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// POST /api/notes - Create new note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      eventId,
      companyId,
      tags = [],
      priority = 'MEDIUM',
      isStandalone = true
    } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Validate that eventId exists if provided
    if (eventId) {
      const event = await prisma.calendarEvent.findUnique({
        where: { id: eventId }
      });
      
      if (!event) {
        return NextResponse.json(
          { error: 'Calendar event not found' },
          { status: 400 }
        );
      }
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        eventId: eventId || null,
        companyId: companyId ? parseInt(companyId) : null,
        tags: JSON.stringify(tags),
        priority: priority.toUpperCase(),
        isStandalone
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true
          }
        },
        company: {
          select: {
            id: true,
            legalName: true,
            tradingName: true
          }
        }
      }
    });

    // Invalidate notes caches after creation
    await CacheInvalidationService.invalidateNotes();
    
    // Also invalidate calendar caches if this note is linked to an event
    if (eventId) {
      await CacheInvalidationService.invalidateCalendar();
    }
    
    // Invalidate company-related caches if this note is linked to a company
    if (companyId) {
      await CacheInvalidationService.invalidateOnCompanyMutation(companyId);
    }

    return NextResponse.json({
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : []
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}