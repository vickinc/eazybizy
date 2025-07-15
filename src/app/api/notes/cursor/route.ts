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

// GET /api/notes/cursor - Get notes with cursor pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 1000);
    const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' || 'desc';
    const companyId = searchParams.get('companyId');
    const eventId = searchParams.get('eventId');
    const priority = searchParams.get('priority');
    const isCompleted = searchParams.get('isCompleted');
    const isStandalone = searchParams.get('isStandalone');
    const search = searchParams.get('search');

    // Build where clause
    const where: unknown = {};
    
    if (companyId && companyId !== 'all') {
      where.companyId = parseInt(companyId);
    }
    
    if (eventId) {
      where.eventId = eventId;
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

    // Get notes with cursor pagination
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
        { createdAt: sortDirection },
        { id: sortDirection }
      ],
      take: limit + 1 // Get one extra to check if there are more results
    });

    // Check if there are more results
    const hasMore = notes.length > limit;
    const actualNotes = hasMore ? notes.slice(0, limit) : notes;

    // Create next cursor
    let nextCursor: string | null = null;
    if (hasMore && actualNotes.length > 0) {
      const lastNote = actualNotes[actualNotes.length - 1];
      nextCursor = createCursor(lastNote.createdAt, lastNote.id);
    }

    return NextResponse.json({
      notes: actualNotes.map(note => ({
        ...note,
        tags: note.tags ? JSON.parse(note.tags) : []
      })),
      pagination: {
        hasMore,
        nextCursor,
        limit,
        count: actualNotes.length
      }
    });

  } catch (error) {
    console.error('Error fetching notes with cursor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}