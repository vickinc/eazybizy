import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { AnniversaryEventService } from '@/services/business/anniversaryEventService';

// POST /api/calendar/anniversary-events/generate - Generate anniversary events
export async function POST(request: NextRequest) {
  try {
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { 
      startDate, 
      endDate, 
      companyId 
    } = body;

    // Default to next 1 year if no dates provided
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : (() => {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1);
      return date;
    })();

    // Get user from database
    const { prisma } = require('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let result;
    
    if (companyId) {
      // Generate for specific company
      result = await AnniversaryEventService.generateAndStoreAnniversaryEvents(
        parseInt(companyId),
        start,
        end,
        user.id
      );
      
      return NextResponse.json({
        success: true,
        message: `Anniversary events generated for company ${companyId}`,
        created: result.created,
        skipped: result.skipped,
        errors: result.errors
      });
    } else {
      // Generate for all companies
      result = await AnniversaryEventService.generateAndStoreAllAnniversaryEvents(
        start,
        end,
        user.id
      );
      
      return NextResponse.json({
        success: true,
        message: 'Anniversary events generated for all companies',
        created: result.totalCreated,
        skipped: result.totalSkipped,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error generating anniversary events:', error);
    return NextResponse.json(
      { error: 'Failed to generate anniversary events' },
      { status: 500 }
    );
  }
}

// GET /api/calendar/anniversary-events/generate - Get upcoming anniversary events
export async function GET(request: NextRequest) {
  try {
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const events = await AnniversaryEventService.getUpcomingAnniversaryEvents(
      companyId ? parseInt(companyId) : undefined
    );

    return NextResponse.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error fetching upcoming anniversary events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming anniversary events' },
      { status: 500 }
    );
  }
}