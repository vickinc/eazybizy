import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface NotesStatistics {
  totalNotes: number;
  completedNotes: number;
  activeNotes: number;
  standaloneNotes: number;
  linkedNotes: number;
  notesByPriority: Array<{ priority: string; count: number }>;
  notesByMonth: Array<{ month: string; count: number }>;
  notesByCompany: Array<{ companyId: number; companyName: string; count: number }>;
  lastUpdated: string;
}

class NotesStatisticsCache {
  private cache: NotesStatistics | null = null;
  private lastUpdate: number = 0;
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  async getStatistics(companyId?: string): Promise<NotesStatistics> {
    const now = Date.now();
    const cacheKey = `notes_stats_${companyId || 'all'}`;
    
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
      totalNotes,
      completedNotes,
      activeNotes,
      standaloneNotes,
      linkedNotes,
      notesByPriority,
      notesByMonth,
      notesByCompany
    ] = await Promise.all([
      // Total notes
      prisma.note.count({ where }),
      
      // Completed notes
      prisma.note.count({
        where: {
          ...where,
          isCompleted: true
        }
      }),
      
      // Active notes (not completed)
      prisma.note.count({
        where: {
          ...where,
          isCompleted: false
        }
      }),
      
      // Standalone notes
      prisma.note.count({
        where: {
          ...where,
          isStandalone: true
        }
      }),
      
      // Linked notes (to events)
      prisma.note.count({
        where: {
          ...where,
          isStandalone: false,
          eventId: { not: null }
        }
      }),
      
      // Notes by priority
      prisma.note.groupBy({
        by: ['priority'],
        where,
        _count: { priority: true }
      }),
      
      // Notes by month (last 12 months)
      prisma.note.groupBy({
        by: ['createdAt'],
        where: {
          ...where,
          createdAt: { gte: startOfMonth }
        },
        _count: { createdAt: true }
      }),
      
      // Notes by company (if not filtering by company)
      companyId && companyId !== 'all' ? [] : prisma.note.groupBy({
        by: ['companyId'],
        where: {
          companyId: { not: null }
        },
        _count: { companyId: true },
        _max: { companyId: true }
      })
    ]);

    // Process monthly data
    const monthlyStats = new Map<string, number>();
    notesByMonth.forEach(item => {
      const month = new Date(item.createdAt).toISOString().slice(0, 7); // YYYY-MM format
      monthlyStats.set(month, (monthlyStats.get(month) || 0) + item._count.createdAt);
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

    // Process company data
    const companyStats: Array<{ companyId: number; companyName: string; count: number }> = [];
    if (notesByCompany.length > 0) {
      // Get company names
      const companyIds = notesByCompany.map(item => item._max.companyId).filter(Boolean) as number[];
      const companies = await prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, tradingName: true, legalName: true }
      });

      notesByCompany.forEach(item => {
        if (item._max.companyId) {
          const company = companies.find(c => c.id === item._max.companyId);
          companyStats.push({
            companyId: item._max.companyId,
            companyName: company?.tradingName || company?.legalName || 'Unknown Company',
            count: item._count.companyId || 0
          });
        }
      });
    }

    const statistics: NotesStatistics = {
      totalNotes,
      completedNotes,
      activeNotes,
      standaloneNotes,
      linkedNotes,
      notesByPriority: notesByPriority.map(item => ({
        priority: item.priority.toLowerCase(),
        count: item._count.priority
      })),
      notesByMonth: monthsArray,
      notesByCompany: companyStats.sort((a, b) => b.count - a.count),
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

const notesStatisticsCache = new NotesStatisticsCache();

// GET /api/notes/statistics - Get notes statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    const statistics = await notesStatisticsCache.getStatistics(companyId || undefined);

    return NextResponse.json(statistics);

  } catch (error) {
    console.error('Error fetching notes statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes statistics' },
      { status: 500 }
    );
  }
}