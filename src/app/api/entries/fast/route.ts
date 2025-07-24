import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/entries/fast - Optimized list endpoint with minimal data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '50');
    
    // Filters
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Build where clause
    const where: Prisma.BookkeepingEntryWhereInput = {
      ...(companyId && companyId !== 'all' && { companyId: parseInt(companyId) }),
      ...(type && { type }),
      ...(dateFrom || dateTo ? {
        date: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        }
      } : {}),
    };
    
    // Fetch minimal data for performance
    const entries = await prisma.bookkeepingEntry.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        type: true,
        category: true,
        description: true,
        amount: true,
        currency: true,
        date: true,
        companyId: true,
      }
    });
    
    const total = await prisma.bookkeepingEntry.count({ where });
    
    return NextResponse.json({
      entries,
      total,
      skip,
      take,
    });
  } catch (error) {
    console.error('Error in fast entries endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}