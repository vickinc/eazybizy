import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CacheService, CacheTTL } from '@/lib/redis';

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

// GET /api/business-cards/cursor - Get business cards with cursor pagination
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' || 'desc';
    const companyId = searchParams.get('companyId');
    const isArchived = searchParams.get('isArchived');
    const template = searchParams.get('template');
    const search = searchParams.get('search');

    // Build where clause
    const where: unknown = {};
    
    if (companyId && companyId !== 'all') {
      where.companyId = parseInt(companyId);
    }
    
    if (isArchived !== null && isArchived !== undefined) {
      where.isArchived = isArchived === 'true';
    }
    
    if (template && template !== 'all') {
      where.template = template.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { personName: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
        { company: { tradingName: { contains: search, mode: 'insensitive' } } },
        { company: { legalName: { contains: search, mode: 'insensitive' } } }
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

    // Generate cache key
    const cacheKey = `business-cards:cursor:${JSON.stringify({ cursor, limit, sortDirection, companyId, isArchived, template, search })}`;

    // Try cache first
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        _cached: true,
        _responseTime: Date.now() - startTime
      });
    }

    // Get business cards with cursor pagination
    const dbStartTime = Date.now();
    const businessCards = await prisma.businessCard.findMany({
      where,
      include: {
        company: true
      },
      orderBy: [
        { createdAt: sortDirection },
        { id: sortDirection }
      ],
      take: limit + 1 // Get one extra to check if there are more results
    });
    const dbTime = Date.now() - dbStartTime;

    // Check if there are more results
    const hasMore = businessCards.length > limit;
    const actualCards = hasMore ? businessCards.slice(0, limit) : businessCards;

    // Create next cursor
    let nextCursor: string | null = null;
    if (hasMore && actualCards.length > 0) {
      const lastCard = actualCards[actualCards.length - 1];
      nextCursor = createCursor(lastCard.createdAt, lastCard.id);
    }

    const responseData = {
      businessCards: actualCards.map(card => ({
        ...card,
        qrValue: card.qrType === 'WEBSITE' ? card.company.website : card.company.email
      })),
      pagination: {
        hasMore,
        nextCursor,
        limit,
        count: actualCards.length
      }
    };

    // Cache for 10 minutes
    await CacheService.set(cacheKey, responseData, CacheTTL.businessCards.list);

    const totalTime = Date.now() - startTime;
    console.log(`[PERF] Business cards cursor: DB=${dbTime}ms, Total=${totalTime}ms`);

    return NextResponse.json({
      ...responseData,
      _cached: false,
      _responseTime: totalTime,
      _dbTime: dbTime
    });

  } catch (error) {
    console.error('Error fetching business cards with cursor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business cards' },
      { status: 500 }
    );
  }
}