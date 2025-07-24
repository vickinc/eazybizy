import { redirect } from 'next/navigation';
import { authenticateRequest } from '@/lib/api-auth';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import { InvoiceSSRService } from '@/services/database/invoiceSSRService';
import { defaultQueryOptions } from '@/lib/queryOptions';
import InvoicesClient from './InvoicesClient';

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function InvoicesPage(props: {
  searchParams: Promise<{ 
    companyId?: string;
    status?: string;
    clientId?: string;
    currency?: string;
    search?: string;
    sortField?: string;
    sortDirection?: string;
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

  // Parse filters from search params
  const filters = {
    companyId: searchParams.companyId || 'all',
    status: searchParams.status || 'all',
    clientId: searchParams.clientId,
    currency: searchParams.currency,
    searchTerm: searchParams.search || '',
    sortField: searchParams.sortField || 'updatedAt',
    sortDirection: (searchParams.sortDirection as 'asc' | 'desc') || 'desc'
  };

  // Parse companyId for database queries
  const parsedCompanyId = filters.companyId === 'all' ? 'all' : parseInt(filters.companyId);

  // Create server-side QueryClient with shared configuration
  const queryClient = new QueryClient({
    defaultOptions: defaultQueryOptions,
  });

  // Prefetch first page of invoices data using direct database access
  // This eliminates HTTP round-trip and reduces payload by ~80%
  // Using minimal initial load (6 invoices) for ultra-fast first paint
  try {
    const [invoicesData, statisticsData] = await Promise.all([
      InvoiceSSRService.getInvoicesForSSR({
        skip: 0,
        take: 6,
        searchTerm: filters.searchTerm,
        status: filters.status as any,
        companyId: typeof parsedCompanyId === 'number' ? parsedCompanyId : undefined,
        sortField: filters.sortField as any,
        sortDirection: filters.sortDirection
      }),
      InvoiceSSRService.getInvoiceStatistics(parsedCompanyId)
    ]);

    // Prefetch the invoices data into React Query cache for client-side hydration
    queryClient.setQueryData(
      ['invoices', {
        company: filters.companyId,
        search: filters.searchTerm,
        status: filters.status,
        currency: filters.currency,
        sortField: filters.sortField,
        sortDirection: filters.sortDirection
      }],
      {
        data: invoicesData.data,
        success: true,
        message: 'Invoices fetched successfully'
      }
    );

    // Prefetch the statistics data separately with company-specific key
    // Make sure key matches what the client-side hook uses (number or 'all', not string)
    queryClient.setQueryData(
      ['invoices-statistics', parsedCompanyId],
      statisticsData
    );

    console.log(`[InvoicesPage] SSR completed in ${Date.now() - startTime}ms - ${invoicesData.data.length} invoices prefetched`);
  } catch (error) {
    console.error('[InvoicesPage] SSR prefetch failed:', error);
    // Don't fail the page, just log and continue - client will handle the error
  }

  // Dehydrate the query cache to send to client
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <InvoicesClient />
    </HydrationBoundary>
  );
}