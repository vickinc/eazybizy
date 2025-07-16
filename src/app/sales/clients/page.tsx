import { redirect } from 'next/navigation';
import { authenticateRequest } from '@/lib/api-auth';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import { ClientSSRService } from '@/services/database/clientSSRService';
import { defaultQueryOptions } from '@/lib/queryOptions';
import ClientsClient from './ClientsClient';

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
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

  // Prefetch first page of clients data using direct database access
  // This eliminates HTTP round-trip and reduces payload by ~80%
  // Using minimal initial load (6 clients) for ultra-fast first paint
  try {
    const clientsData = await ClientSSRService.getClientsForSSR({
      skip: 0,
      take: 6,
      searchTerm: '',
      sortField: 'updatedAt',
      sortDirection: 'desc'
    });

    // Prefetch the data into React Query cache for client-side hydration
    // This prevents the client from making duplicate API calls
    queryClient.setQueryData(
      ['clients', {
        company: 'all',
        search: '',
        status: 'all',
        industry: 'all',
        sortField: 'updatedAt',
        sortDirection: 'desc'
      }],
      {
        data: clientsData.data,
        success: true,
        message: 'Clients fetched successfully',
        summary: {
          totalClients: clientsData.pagination.total,
          totalRevenue: clientsData.data.reduce((sum, client) => sum + client.totalInvoiced, 0)
        },
        statusBreakdown: {
          active: { count: clientsData.data.filter(c => c.status === 'ACTIVE').length },
          inactive: { count: clientsData.data.filter(c => c.status === 'INACTIVE').length },
          leads: { count: clientsData.data.filter(c => c.status === 'LEAD').length },
          archived: { count: clientsData.data.filter(c => c.status === 'ARCHIVED').length }
        },
        recentClients: clientsData.data.slice(0, 5)
      }
    );

    console.log(`[ClientsPage] SSR completed in ${Date.now() - startTime}ms - ${clientsData.data.length} clients prefetched`);
  } catch (error) {
    console.error('[ClientsPage] SSR prefetch failed:', error);
    // Don't fail the page, just log and continue - client will handle the error
  }

  // Dehydrate the query cache to send to client
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <ClientsClient />
    </HydrationBoundary>
  );
}