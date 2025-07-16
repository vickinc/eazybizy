import { redirect } from 'next/navigation';
import { authenticateRequest } from '@/lib/api-auth';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import { InvoiceSSRService } from '@/services/database/invoiceSSRService';
import { defaultQueryOptions } from '@/lib/queryOptions';
import InvoicesClient from './InvoicesClient';

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
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

  // Prefetch first page of invoices data using direct database access
  // This eliminates HTTP round-trip and reduces payload by ~80%
  // Using minimal initial load (6 invoices) for ultra-fast first paint
  try {
    const invoicesData = await InvoiceSSRService.getInvoicesForSSR({
      skip: 0,
      take: 6,
      searchTerm: '',
      sortField: 'updatedAt',
      sortDirection: 'desc'
    });

    // Prefetch the data into React Query cache for client-side hydration
    // This prevents the client from making duplicate API calls
    queryClient.setQueryData(
      ['invoices', {
        company: 'all',
        search: '',
        status: 'all',
        currency: undefined,
        sortField: 'updatedAt',
        sortDirection: 'desc'
      }],
      {
        data: invoicesData.data,
        success: true,
        message: 'Invoices fetched successfully',
        statistics: {
          total: invoicesData.pagination.total,
          totalValue: invoicesData.data.reduce((sum, inv) => sum + inv.totalAmount, 0),
          draft: invoicesData.data.filter(inv => inv.status === 'draft').length,
          sent: invoicesData.data.filter(inv => inv.status === 'sent').length,
          paid: invoicesData.data.filter(inv => inv.status === 'paid').length,
          overdue: invoicesData.data.filter(inv => inv.status === 'overdue').length,
          archived: invoicesData.data.filter(inv => inv.status === 'archived').length
        }
      }
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