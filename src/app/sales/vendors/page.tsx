import { redirect } from 'next/navigation';
import { authenticateRequest } from '@/lib/api-auth';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import { VendorSSRService } from '@/services/database/vendorSSRService';
import { defaultQueryOptions } from '@/lib/queryOptions';
import VendorsClient from './VendorsClient';

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function VendorsPage() {
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

  // Prefetch first page of vendors data using direct database access
  // This eliminates HTTP round-trip and reduces payload by ~80%
  // Using minimal initial load (6 vendors) for ultra-fast first paint
  try {
    const vendorsData = await VendorSSRService.getVendorsForSSR({
      skip: 0,
      take: 6,
      searchTerm: '',
      sortField: 'updatedAt',
      sortDirection: 'desc'
    });

    // Prefetch the data into React Query cache for client-side hydration
    // This prevents the client from making duplicate API calls
    queryClient.setQueryData(
      ['vendors', {
        company: 'all',
        search: '',
        status: 'all',
        currency: undefined,
        sortField: 'updatedAt',
        sortDirection: 'desc'
      }],
      {
        data: vendorsData.data,
        success: true,
        message: 'Vendors fetched successfully',
        statistics: {
          total: vendorsData.pagination.total,
          active: vendorsData.data.filter(v => v.isActive).length,
          inactive: vendorsData.data.filter(v => !v.isActive).length,
          avgPaymentTerms: vendorsData.data.reduce((sum, v) => sum + parseFloat(v.paymentTerms), 0) / vendorsData.data.length
        }
      }
    );

    console.log(`[VendorsPage] SSR completed in ${Date.now() - startTime}ms - ${vendorsData.data.length} vendors prefetched`);
  } catch (error) {
    console.error('[VendorsPage] SSR prefetch failed:', error);
    // Don't fail the page, just log and continue - client will handle the error
  }

  // Dehydrate the query cache to send to client
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <VendorsClient />
    </HydrationBoundary>
  );
}