import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { authenticateRequest } from '@/lib/api-auth';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import { TaxTreatmentsSSRService } from '@/services/database/taxTreatmentsSSRService';
import { defaultQueryOptions } from '@/lib/queryOptions';
import { taxTreatmentsQueryKeys } from '@/hooks/useTaxTreatmentsAPI';
import TaxTreatmentsClient from './TaxTreatmentsClient';

export const metadata: Metadata = {
  title: 'Tax Treatments | EazyBizy',
  description: 'Manage tax rates (VAT/Sales Tax/GST), categories, and applicability for accounting transactions',
};

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function TaxTreatmentsPage() {
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

  // Prefetch tax treatments data using direct database access
  // This eliminates HTTP round-trip and reduces payload
  const queryKey = taxTreatmentsQueryKeys.list({
    search: '',
    category: 'all',
    isActive: 'all',
    applicability: 'all',
    minRate: 0,
    maxRate: 100,
    sortField: 'code',
    sortDirection: 'asc'
  });

  try {
    // Prefetch tax treatments data
    const treatmentsData = await TaxTreatmentsSSRService.getTaxTreatmentsForSSR({
      skip: 0,
      take: 1000, // Get all treatments for initial load
      searchTerm: '',
      sortField: 'code',
      sortDirection: 'asc'
    });

    // Transform SSR data to match client expectations
    const transformedData = {
      data: treatmentsData.data,
      pagination: treatmentsData.pagination,
      statistics: {
        total: treatmentsData.pagination.total,
        averageRate: 0, // Will be loaded separately
        categoryStats: {},
        activeStats: {}
      },
    };

    // Prefetch the transformed data
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => Promise.resolve(transformedData),
    });

  } catch (error) {
    // Log error but don't block rendering - client will handle error state
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to prefetch tax treatments via SSR service:', error);
      console.error('Falling back to client-side fetching');
    }
  }

  const totalTime = Date.now() - startTime;
  if (process.env.NODE_ENV === 'development') {
    console.log(`Tax Treatments SSR prefetch completed in ${totalTime}ms`);
  }

  // Dehydrate the cache to send to client
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <TaxTreatmentsClient />
    </HydrationBoundary>
  );
}