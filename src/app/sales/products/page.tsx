import { redirect } from 'next/navigation';
import { authenticateRequest } from '@/lib/api-auth';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import { ProductSSRService } from '@/services/database/productSSRService';
import { defaultQueryOptions } from '@/lib/queryOptions';
import ProductsClient from './ProductsClient';

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
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

  // Prefetch first page of products data using direct database access
  // This eliminates HTTP round-trip and reduces payload by ~80%
  // Using minimal initial load (6 products) for ultra-fast first paint
  const queryKey = [
    'products',
    {
      company: 'all', // Default to all companies
      search: '', // searchTerm
      status: 'all', // statusFilter
      currency: undefined, // currencyFilter
      sortField: 'updatedAt', // sortField
      sortDirection: 'desc' // sortDirection
    }
  ];

  try {
    // Option 1: Use cursor pagination for O(1) scalability (recommended for large datasets)
    const useCursorPagination = process.env.ENABLE_CURSOR_PAGINATION === 'true'
    
    if (useCursorPagination) {
      // Use cursor-based pagination for better scalability
      const productsData = await ProductSSRService.getProductsForSSRCursor({
        take: 6,
        searchTerm: '',
        isActive: undefined, // Show all (active and inactive)
        companyId: undefined, // All companies
        currency: '',
        sortField: 'updatedAt',
        sortDirection: 'desc'
      });

      // Transform cursor data to match client expectations
      const transformedData = {
        data: productsData.data,
        statistics: {
          total: 0, // Total count not available in cursor pagination
          averagePrice: 0,
          averageCost: 0,
          totalValue: 0,
          activeStats: {}
        },
        cursor: productsData.nextCursor,
        hasMore: productsData.hasMore,
      };

      await queryClient.prefetchQuery({
        queryKey,
        queryFn: () => Promise.resolve(transformedData),
      });
    } else {
      // Option 2: Use offset pagination (current implementation)
      const productsData = await ProductSSRService.getProductsForSSR({
        skip: 0,
        take: 6,
        searchTerm: '',
        isActive: undefined, // Show all (active and inactive)
        companyId: undefined, // All companies
        currency: '',
        sortField: 'updatedAt',
        sortDirection: 'desc'
      });

      // Transform minimal data to match existing client expectations
      const transformedData = {
        data: productsData.data,
        // Statistics will be loaded separately for better performance
        statistics: {
          total: productsData.pagination.total,
          averagePrice: 0,
          averageCost: 0,
          totalValue: 0,
          activeStats: {}
        },
        pagination: productsData.pagination
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
      console.error('Failed to prefetch products via SSR service:', error);
      console.error('Falling back to client-side fetching');
    }
  }

  const totalTime = Date.now() - startTime;
  if (process.env.NODE_ENV === 'development') {
    console.log(`Products SSR prefetch completed in ${totalTime}ms`);
  }

  // Dehydrate the cache to send to client
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <ProductsClient />
    </HydrationBoundary>
  );
}