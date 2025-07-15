import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { AnniversaryApiService } from '@/services/api/anniversaryApiService';

// GET /api/calendar/anniversary-events/upcoming - Get upcoming anniversary events
export async function GET(request: NextRequest) {
  try {
    const { user: currentUser, error } = await authenticateRequest();
    if (error) return error;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '60'); // Default to 60 days
    const companyId = searchParams.get('companyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Use the anniversary API service
    const result = await AnniversaryApiService.getUpcomingAnniversaryEvents({
      userId: user.id,
      days,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      companyId: companyId ? parseInt(companyId) : undefined
    });

    // Return the events with metadata
    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error fetching upcoming anniversary events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming anniversary events' },
      { status: 500 }
    );
  }
}