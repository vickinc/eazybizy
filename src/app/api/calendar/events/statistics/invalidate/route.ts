import { NextResponse } from 'next/server';

// We need to share the cache instance with the main statistics route
// Import the cache class and create a shared instance
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

  invalidate(): void {
    this.cache = null;
    this.lastUpdate = 0;
  }
}

// Export a singleton instance to be shared across the application
const calendarStatisticsCache = new CalendarStatisticsCache();

// POST /api/calendar/events/statistics/invalidate - Invalidate statistics cache
export async function POST() {
  try {
    calendarStatisticsCache.invalidate();
    
    return NextResponse.json({ 
      message: 'Calendar statistics cache invalidated successfully' 
    });

  } catch (error) {
    console.error('Error invalidating calendar statistics cache:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
}