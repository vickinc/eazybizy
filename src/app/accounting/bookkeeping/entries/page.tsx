import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { authenticateRequest } from '@/lib/api-auth';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { EntrySSRService } from '@/services/database/entrySSRService';
import { defaultQueryOptions } from '@/lib/queryOptions';
import EntriesClient from './EntriesClient';

export const metadata: Metadata = {
  title: 'Revenue & Expense Entries | Bookkeeping',
  description: 'Manage revenue and expense entries with category-based tracking and linking capabilities',
};

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function EntriesPage(props: {
  searchParams: Promise<{ 
    companyId?: string;
    type?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: string;
    highlight?: string;
  }>;
}) {
  const startTime = Date.now();
  
  // Server-side authentication check only
  const { user, error } = await authenticateRequest();
  
  if (!user || error) {
    // Redirect to login if not authenticated
    redirect('/auth/login');
  }

  // Await searchParams as required by Next.js 15
  const searchParams = await props.searchParams;

  // Create server-side QueryClient with shared configuration
  const queryClient = new QueryClient({
    defaultOptions: defaultQueryOptions,
  });

  // Parse filters from search params
  const filters = {
    companyId: searchParams.companyId || 'all',
    type: searchParams.type as 'revenue' | 'expense' | undefined,
    category: searchParams.category,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    search: searchParams.search,
  };

  // Parse pagination
  const page = parseInt(searchParams.page || '1', 10);
  const take = 20;
  const skip = (page - 1) * take;

  const pagination = {
    skip,
    take,
    sortBy: 'date',
    sortOrder: 'desc' as const,
  };

  try {
    // Prefetch entries data with minimal initial load for fast first paint
    await queryClient.prefetchQuery({
      queryKey: ['entries', 'list', filters, pagination],
      queryFn: async () => {
        try {
          const data = await EntrySSRService.getEntries(filters, pagination);
          return {
            entries: data.entries,
            pagination: data.pagination,
            stats: {
              totalAmount: 0,
              totalCogs: 0,
              totalCogsPaid: 0,
              averageAmount: 0,
              count: data.entries.length,
              income: { total: 0, count: 0 },
              expense: { total: 0, count: 0 },
              netProfit: 0,
            },
          };
        } catch (error) {
          console.warn('Failed to fetch entries in SSR, returning empty result:', error);
          // Return empty result to prevent page crash
          return {
            entries: [],
            pagination: { total: 0, skip: 0, take: pagination.take || 20, hasMore: false },
            stats: {
              totalAmount: 0,
              totalCogs: 0,
              totalCogsPaid: 0,
              averageAmount: 0,
              count: 0,
              income: { total: 0, count: 0 },
              expense: { total: 0, count: 0 },
              netProfit: 0,
            },
          };
        }
      },
    });

    // Prefetch statistics (with fallback)
    await queryClient.prefetchQuery({
      queryKey: ['entries', 'stats', filters],
      queryFn: async () => {
        try {
          return await EntrySSRService.getEntryStatistics(filters);
        } catch (error) {
          console.warn('Failed to fetch entry statistics in SSR, returning empty result:', error);
          // Return empty stats to prevent page crash
          return {
            summary: {
              totalEntries: 0,
              totalIncome: 0,
              totalExpenses: 0,
              totalCogs: 0,
              totalCogsPaid: 0,
              netProfit: 0,
              incomeCount: 0,
              expenseCount: 0,
            },
            categoryBreakdown: [],
            recentEntries: [],
          };
        }
      },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Entries SSR completed in ${duration}ms`);
    }
  } catch (error) {
    console.error('Error prefetching entries data:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      meta: (error as any)?.meta,
      filters,
      pagination
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`❌ Entries SSR failed after ${duration}ms`);
    
    // Don't throw the error - let the page render with client-side fetching as fallback
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EntriesClient 
        initialFilters={filters}
        initialPagination={pagination}
        highlightId={searchParams.highlight}
      />
    </HydrationBoundary>
  );
}