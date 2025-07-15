import { redirect } from 'next/navigation';
import { authenticateRequest } from '@/lib/api-auth';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import { CompanySSRService } from '@/services/database/companySSRService';
import { defaultQueryOptions } from '@/lib/queryOptions';
import CompaniesClient from './CompaniesClient';

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
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

  // Prefetch first page of companies data using direct database access
  // This eliminates HTTP round-trip and reduces payload by ~80%
  // Using minimal initial load (6 companies) for ultra-fast first paint
  const queryKey = [
    'companies',
    '', // searchTerm
    'all', // statusFilter
    '', // industryFilter
    0, // skip
    6, // take - minimal load for fastest initial paint
    'updatedAt', // sortField
    'desc' // sortDirection
  ];

  try {
    // Option 1: Use cursor pagination for O(1) scalability (recommended for large datasets)
    const useCursorPagination = process.env.ENABLE_CURSOR_PAGINATION === 'true'
    
    if (useCursorPagination) {
      // Use cursor-based pagination for better scalability
      const companiesData = await CompanySSRService.getCompaniesForSSRCursor({
        take: 6,
        searchTerm: '',
        statusFilter: 'all',
        industryFilter: '',
        sortField: 'updatedAt',
        sortDirection: 'desc'
      });

      // Transform cursor data to match client expectations
      const transformedData = {
        data: companiesData.data,
        pagination: {
          total: 0, // Total count not available in cursor pagination
          skip: 0,
          take: 6,
          hasMore: companiesData.hasMore,
        },
        cursor: companiesData.nextCursor,
        statistics: {
          totalActive: 0,
          totalPassive: 0,
          byIndustry: {},
          newThisMonth: 0
        }
      };

      await queryClient.prefetchQuery({
        queryKey,
        queryFn: () => Promise.resolve(transformedData),
      });
    } else {
      // Option 2: Use offset pagination (current implementation)
      const companiesData = await CompanySSRService.getCompaniesForSSR({
        skip: 0,
        take: 6,
        searchTerm: '',
        statusFilter: 'all',
        industryFilter: '',
        sortField: 'updatedAt',
        sortDirection: 'desc'
      });

      // Transform minimal data to match existing client expectations
      const transformedData = {
        data: companiesData.data,
        pagination: companiesData.pagination,
        // Statistics will be loaded separately for better performance
        statistics: {
          totalActive: 0,
          totalPassive: 0,
          byIndustry: {},
          newThisMonth: 0
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
      console.error('Failed to prefetch companies via SSR service:', error);
      console.error('Falling back to client-side fetching');
    }
  }

  const totalTime = Date.now() - startTime;
  if (process.env.NODE_ENV === 'development') {
    console.log(`SSR prefetch completed in ${totalTime}ms`);
  }

  // Dehydrate the cache to send to client
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <CompaniesClient />
    </HydrationBoundary>
  );
}