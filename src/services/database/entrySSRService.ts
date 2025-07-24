import { prisma, executeWithRetry } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface EntryFilters {
  companyId?: string;
  type?: 'revenue' | 'expense';
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  accountId?: string;
  chartOfAccountsId?: string;
}

interface PaginationOptions {
  skip?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(filters: EntryFilters, options: PaginationOptions): string {
  return JSON.stringify({ filters, options });
}

export class EntrySSRService {
  // Get entries with minimal data for initial page load
  static async getEntries(
    filters: EntryFilters = {},
    options: PaginationOptions = {}
  ) {
    const {
      skip = 0,
      take = 6, // Small initial load
      sortBy = 'date',
      sortOrder = 'desc'
    } = options;

    // Check cache
    const cacheKey = getCacheKey(filters, options);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      // Build where clause
      const where: Prisma.BookkeepingEntryWhereInput = {
        ...(filters.companyId && filters.companyId !== 'all' && { 
          companyId: parseInt(filters.companyId) 
        }),
        ...(filters.type && { type: filters.type }),
        ...(filters.category && { category: filters.category }),
        ...(filters.accountId && { accountId: filters.accountId }),
        ...(filters.chartOfAccountsId && { chartOfAccountsId: filters.chartOfAccountsId }),
        ...(filters.dateFrom || filters.dateTo ? {
          date: {
            ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
            ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
          }
        } : {}),
        ...(filters.search && {
          OR: [
            { description: { contains: filters.search } },
            { category: { contains: filters.search } },
            { reference: { contains: filters.search } },
          ]
        })
      };

      // Build orderBy
      const orderBy: Prisma.BookkeepingEntryOrderByWithRelationInput = {
        [sortBy]: sortOrder
      };

      // Execute queries in parallel for performance with retry logic
      const [entries, total] = await Promise.all([
        executeWithRetry(() => 
          prisma.bookkeepingEntry.findMany({
            where,
            skip,
            take,
            orderBy,
            select: {
              id: true,
              type: true,
              category: true,
              subcategory: true,
              description: true,
              amount: true,
              currency: true,
              date: true,
              reference: true,
              cogs: true,
              cogsPaid: true,
              isFromInvoice: true,
              companyId: true,
              createdAt: true,
              linkedIncomeId: true,
              // Include minimal related data
              company: {
                select: {
                  id: true,
                  tradingName: true,
                  baseCurrency: true,
                }
              },
              chartOfAccount: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                }
              },
              linkedIncome: {
                select: {
                  id: true,
                  type: true,
                  category: true,
                  description: true,
                  reference: true,
                  amount: true,
                  currency: true,
                  date: true,
                  cogs: true,
                }
              },
              linkedExpenses: {
                select: {
                  id: true,
                  type: true,
                  category: true,
                  description: true,
                  reference: true,
                  amount: true,
                  currency: true,
                  date: true,
                  vendorInvoice: true,
                }
              }
            }
          })
        ),
        executeWithRetry(() => 
          prisma.bookkeepingEntry.count({ where })
        )
      ]);

      const result = {
        entries,
        pagination: {
          total,
          skip,
          take,
          hasMore: skip + take < total,
        }
      };

      // Update cache
      cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error('Error in EntrySSRService.getEntries:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        meta: (error as any)?.meta,
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        options
      });
      throw error;
    }
  }

  // Get statistics for dashboard
  static async getEntryStatistics(filters: EntryFilters = {}) {
    const cacheKey = `stats_${JSON.stringify(filters)}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      // Build where clause
      const where: Prisma.BookkeepingEntryWhereInput = {
        ...(filters.companyId && filters.companyId !== 'all' && { 
          companyId: parseInt(filters.companyId) 
        }),
        ...(filters.dateFrom || filters.dateTo ? {
          date: {
            ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
            ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
          }
        } : {}),
      };

      // Get statistics in parallel with retry logic
      const [
        totalStats,
        incomeStats,
        expenseStats,
        categoryBreakdown,
        recentEntries
      ] = await Promise.all([
        // Total stats
        executeWithRetry(() =>
          prisma.bookkeepingEntry.aggregate({
            where,
            _count: { _all: true },
          })
        ),
        // Income stats
        executeWithRetry(() =>
          prisma.bookkeepingEntry.aggregate({
            where: { ...where, type: 'revenue' },
            _sum: { amount: true },
            _count: { _all: true },
          })
        ),
        // Expense stats
        executeWithRetry(() =>
          prisma.bookkeepingEntry.aggregate({
            where: { ...where, type: 'expense' },
            _sum: { amount: true, cogs: true, cogsPaid: true },
            _count: { _all: true },
          })
        ),
        // Category breakdown
        executeWithRetry(() =>
          prisma.bookkeepingEntry.groupBy({
            by: ['category', 'type'],
            where,
            _sum: { amount: true },
            _count: { _all: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 10,
          })
        ),
        // Recent entries
        executeWithRetry(() =>
          prisma.bookkeepingEntry.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              type: true,
              category: true,
              description: true,
              amount: true,
              currency: true,
              date: true,
            }
          })
        )
      ]);

      const result = {
        summary: {
          totalEntries: totalStats._count._all,
          totalIncome: incomeStats._sum.amount || 0,
          totalExpenses: expenseStats._sum.amount || 0,
          totalCogs: expenseStats._sum.cogs || 0,
          totalCogsPaid: expenseStats._sum.cogsPaid || 0,
          netProfit: (incomeStats._sum.amount || 0) - (expenseStats._sum.amount || 0),
          incomeCount: incomeStats._count._all,
          expenseCount: expenseStats._count._all,
        },
        categoryBreakdown: categoryBreakdown.map(item => ({
          category: item.category,
          type: item.type,
          total: item._sum.amount || 0,
          count: item._count._all,
        })),
        recentEntries,
      };

      // Update cache
      cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error('Error in EntrySSRService.getEntryStatistics:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        meta: (error as any)?.meta,
        stack: error instanceof Error ? error.stack : undefined,
        filters
      });
      throw error;
    }
  }

  // Clear cache - useful for invalidation
  static clearCache() {
    cache.clear();
  }

  // Get single entry by ID
  static async getEntryById(id: string) {
    try {
      const entry = await prisma.bookkeepingEntry.findUnique({
        where: { id },
        include: {
          company: {
            select: {
              id: true,
              legalName: true,
              tradingName: true,
              baseCurrency: true,
            }
          },
          account: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              clientName: true,
              totalAmount: true,
              status: true,
            }
          },
          chartOfAccount: true,
        }
      });

      return entry;
    } catch (error) {
      console.error('Error in EntrySSRService.getEntryById:', error);
      throw error;
    }
  }

  // Get entries for export
  static async getEntriesForExport(filters: EntryFilters = {}) {
    try {
      const where: Prisma.BookkeepingEntryWhereInput = {
        ...(filters.companyId && filters.companyId !== 'all' && { 
          companyId: parseInt(filters.companyId) 
        }),
        ...(filters.type && { type: filters.type }),
        ...(filters.dateFrom || filters.dateTo ? {
          date: {
            ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
            ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
          }
        } : {}),
      };

      const entries = await prisma.bookkeepingEntry.findMany({
        where,
        orderBy: { date: 'desc' },
        include: {
          company: {
            select: {
              tradingName: true,
            }
          },
          chartOfAccount: {
            select: {
              code: true,
              name: true,
            }
          }
        }
      });

      return entries;
    } catch (error) {
      console.error('Error in EntrySSRService.getEntriesForExport:', error);
      throw error;
    }
  }
}