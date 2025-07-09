import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CalendarStatistics {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  eventsByType: Array<{ type: string; count: number }>;
  eventsByPriority: Array<{ priority: string; count: number }>;
  eventsByMonth: Array<{ month: string; count: number }>;
  lastUpdated: string;
}

class CalendarStatisticsCache {
  private cache: CalendarStatistics | null = null;
  private lastUpdate: number = 0;
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  async getStatistics(companyId?: string): Promise<CalendarStatistics> {
    const now = Date.now();
    const cacheKey = `calendar_stats_${companyId || 'all'}`;
    
    // Check if cache is still valid
    if (this.cache && (now - this.lastUpdate) < this.TTL_MS) {
      return this.cache;
    }

    // Calculate fresh statistics
    const where: unknown = {};
    if (companyId && companyId !== 'all') {
      where.companyId = parseInt(companyId);
    }

    const now_date = new Date();
    const startOfMonth = new Date(now_date.getFullYear(), now_date.getMonth() - 11, 1);

    const [
      totalEvents,
      upcomingEvents,
      pastEvents,
      eventsByType,
      eventsByPriority,
      eventsByMonth
    ] = await Promise.all([
      // Total events
      prisma.calendarEvent.count({ where }),
      
      // Upcoming events (today and future)
      prisma.calendarEvent.count({
        where: {
          ...where,
          date: { gte: new Date(now_date.getFullYear(), now_date.getMonth(), now_date.getDate()) }
        }
      }),
      
      // Past events
      prisma.calendarEvent.count({
        where: {
          ...where,
          date: { lt: new Date(now_date.getFullYear(), now_date.getMonth(), now_date.getDate()) }
        }
      }),
      
      // Events by type
      prisma.calendarEvent.groupBy({
        by: ['type'],
        where,
        _count: { type: true }
      }),
      
      // Events by priority
      prisma.calendarEvent.groupBy({
        by: ['priority'],
        where,
        _count: { priority: true }
      }),
      
      // Events by month (last 12 months)
      prisma.calendarEvent.groupBy({
        by: ['date'],
        where: {
          ...where,
          date: { gte: startOfMonth }
        },
        _count: { date: true }
      })
    ]);

    // Process monthly data
    const monthlyStats = new Map<string, number>();
    eventsByMonth.forEach(item => {
      const month = new Date(item.date).toISOString().slice(0, 7); // YYYY-MM format
      monthlyStats.set(month, (monthlyStats.get(month) || 0) + item._count.date);
    });

    // Generate last 12 months
    const monthsArray: Array<{ month: string; count: number }> = [];
    for (const i = 11; i >= 0; i--) {
      const date = new Date(now_date.getFullYear(), now_date.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      monthsArray.push({
        month: monthKey,
        count: monthlyStats.get(monthKey) || 0
      });
    }

    const statistics: CalendarStatistics = {
      totalEvents,
      upcomingEvents,
      pastEvents,
      eventsByType: eventsByType.map(item => ({
        type: item.type.toLowerCase(),
        count: item._count.type
      })),
      eventsByPriority: eventsByPriority.map(item => ({
        priority: item.priority.toLowerCase(),
        count: item._count.priority
      })),
      eventsByMonth: monthsArray,
      lastUpdated: new Date().toISOString()
    };

    // Update cache
    this.cache = statistics;
    this.lastUpdate = now;

    return statistics;
  }

  invalidate(): void {
    this.cache = null;
    this.lastUpdate = 0;
  }
}

const calendarStatisticsCache = new CalendarStatisticsCache();

// GET /api/calendar/events/statistics - Get calendar statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    const statistics = await calendarStatisticsCache.getStatistics(companyId || undefined);

    return NextResponse.json(statistics);

  } catch (error) {
    console.error('Error fetching calendar statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar statistics' },
      { status: 500 }
    );
  }
}

