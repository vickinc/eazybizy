import { redirect } from 'next/navigation';
import { authenticateRequest } from '@/lib/api-auth';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import { BalanceSSRService } from '@/services/database/balanceSSRService';
import { defaultQueryOptions } from '@/lib/queryOptions';
import BalancesClient from './BalancesClient';

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function BalancesPage() {
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

  // Prefetch initial balances data using direct database access
  // This eliminates HTTP round-trip and reduces payload significantly
  // Using minimal initial load for ultra-fast first paint
  const queryKey = [
    'balances',
    {
      company: 'all', // Default to all companies
      accountType: 'all', // All account types
      search: '', // No search term
      showZeroBalances: true, // Show all balances
      viewFilter: 'all', // All views
      groupBy: 'account', // Group by account type
      selectedPeriod: 'thisMonth', // Default period
      startDate: '', // No custom range
      endDate: '', // No custom range
      sortField: 'finalBalance', // Sort by balance
      sortDirection: 'desc', // Highest first
      includeBlockchainBalances: true // CRITICAL: Match client-side query key
    }
  ];

  try {
    // Use SSR service for optimized database queries
    const balancesData = await BalanceSSRService.getBalancesForSSR({
      company: 'all',
      accountType: 'all',
      search: '',
      showZeroBalances: true,
      viewFilter: 'all',
      groupBy: 'account',
      selectedPeriod: 'thisMonth',
      startDate: '',
      endDate: '',
      sortField: 'finalBalance',
      sortDirection: 'desc',
      includeBlockchainBalances: true // Enable blockchain balance enrichment in SSR
    });

    // Transform data to match client expectations
    const transformedData = {
      data: balancesData.data,
      summary: balancesData.summary,
      filters: balancesData.filters
    };

    // Prefetch the transformed data
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => Promise.resolve(transformedData),
    });

  } catch (error) {
    // Log error but don't block rendering - client will handle error state
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to prefetch balances via SSR service:', error);
      console.error('Falling back to client-side fetching');
    }
  }

  const totalTime = Date.now() - startTime;
  if (process.env.NODE_ENV === 'development') {
    console.log(`Balances SSR prefetch completed in ${totalTime}ms`);
  }

  // Dehydrate the cache to send to client
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <BalancesClient />
    </HydrationBoundary>
  );
}