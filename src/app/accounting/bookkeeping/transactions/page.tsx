import { redirect } from 'next/navigation';
import { authenticateRequest } from '@/lib/api-auth';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import { TransactionSSRService } from '@/services/database/transactionSSRService';
import { defaultQueryOptions } from '@/lib/queryOptions';
import TransactionsClient from './TransactionsClient';

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const startTime = Date.now();
  
  // Server-side authentication check only
  const { user, error } = await authenticateRequest();
  
  if (!user || error) {
    // Redirect to login if not authenticated
    redirect('/auth/login');
  }

  // Create server-side QueryClient with shared configuration
  const queryClient = new QueryClient({
    defaultOptions: defaultQueryOptions,
  });

  // Prefetch first page of transactions data using direct database access
  // This eliminates HTTP round-trip and reduces payload by ~80%
  // Using minimal initial load (6 transactions) for ultra-fast first paint
  const queryKey = [
    'transactions',
    {
      company: 'all', // Default to all companies
      searchTerm: '', // searchTerm
      status: 'all', // statusFilter
      reconciliationStatus: 'all', // reconciliationStatusFilter
      approvalStatus: 'all', // approvalStatusFilter
      accountId: 'all', // accountIdFilter
      accountType: 'all', // accountTypeFilter
      currency: 'all', // currencyFilter
      dateRange: 'all', // dateRangeFilter
      dateFrom: undefined, // customDateFrom
      dateTo: undefined, // customDateTo
      sortField: 'date', // sortField
      sortDirection: 'desc', // sortDirection
      take: 10000 // pageSize
    }
  ];

  try {
    // Option 1: Use cursor pagination for O(1) scalability (recommended for large datasets)
    const useCursorPagination = process.env.ENABLE_CURSOR_PAGINATION === 'true'
    
    if (useCursorPagination) {
      // Use cursor-based pagination for better scalability
      const transactionsData = await TransactionSSRService.getTransactionsForSSRCursor({
        take: 10000,
        searchTerm: '',
        status: 'all',
        reconciliationStatus: 'all',
        approvalStatus: 'all',
        accountId: undefined,
        accountType: 'all',
        currency: 'all',
        companyId: undefined, // All companies
        dateRange: 'all',
        sortField: 'date',
        sortDirection: 'desc'
      });

      // Transform cursor data to match client expectations
      const transformedData = {
        data: transactionsData.data,
        cursor: transactionsData.nextCursor,
        hasMore: transactionsData.hasMore,
        statistics: {
          total: 0, // Total count not available in cursor pagination
          totalIncoming: 0,
          totalOutgoing: 0,
          netAmount: 0,
        }
      };

      await queryClient.prefetchQuery({
        queryKey,
        queryFn: () => Promise.resolve(transformedData),
      });
    } else {
      // Option 2: Use offset pagination (current implementation)
      const transactionsData = await TransactionSSRService.getTransactionsForSSR({
        skip: 0,
        take: 10000,
        searchTerm: '',
        status: 'all',
        reconciliationStatus: 'all',
        approvalStatus: 'all',
        accountId: undefined,
        accountType: 'all',
        currency: 'all',
        companyId: undefined, // All companies
        dateRange: 'all',
        sortField: 'date',
        sortDirection: 'desc'
      });

      // Transform minimal data to match existing client expectations
      const transformedData = {
        data: transactionsData.data,
        pagination: transactionsData.pagination,
        // Statistics will be loaded separately for better performance
        statistics: {
          total: transactionsData.pagination.total,
          totalIncoming: 0,
          totalOutgoing: 0,
          netAmount: 0,
        }
      };

      // Prefetch the transformed data
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: () => Promise.resolve(transformedData),
      });
    }

  } catch (error) {
    // Log error but don't block rendering - client will handle error state
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to prefetch transactions via SSR service:', error);
      console.error('Falling back to client-side fetching');
    }
  }

  const totalTime = Date.now() - startTime;
  if (process.env.NODE_ENV === 'development') {
    console.log(`Transactions SSR prefetch completed in ${totalTime}ms`);
  }

  // Dehydrate the cache to send to client
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <TransactionsClient />
    </HydrationBoundary>
  );
}