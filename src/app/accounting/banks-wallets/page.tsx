import { redirect } from 'next/navigation';
import { authenticateRequest } from '@/lib/api-auth';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import { BanksWalletsSSRService } from '@/services/database/banksWalletsSSRService';
import { defaultQueryOptions } from '@/lib/queryOptions';
import BanksWalletsClient from './BanksWalletsClient';

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function BanksWalletsPage() {
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

  // Prefetch first set of banks and wallets data using direct database access
  // This eliminates HTTP round-trip and reduces payload by ~80%
  // Using minimal initial load (6 items total) for ultra-fast first paint
  try {
    const banksWalletsData = await BanksWalletsSSRService.getBanksWalletsForSSR({
      skip: 0,
      take: 6,
      searchTerm: '',
      viewFilter: 'all',
      currencyFilter: 'all',
      typeFilter: 'all',
      companyId: 'all',
      sortField: 'updatedAt',
      sortDirection: 'desc'
    });

    // Prefetch bank accounts data into React Query cache for client-side hydration
    // This prevents the client from making duplicate API calls
    queryClient.setQueryData(
      ['bank-accounts', 'all'],
      {
        data: banksWalletsData.bankAccounts,
        total: banksWalletsData.bankAccounts.length
      }
    );

    // Prefetch digital wallets data into React Query cache for client-side hydration
    queryClient.setQueryData(
      ['digital-wallets', 'all'],
      {
        data: banksWalletsData.digitalWallets,
        total: banksWalletsData.digitalWallets.length
      }
    );

    console.log(`[BanksWalletsPage] SSR completed in ${Date.now() - startTime}ms - ${banksWalletsData.bankAccounts.length} banks, ${banksWalletsData.digitalWallets.length} wallets prefetched`);
  } catch (error) {
    console.error('[BanksWalletsPage] SSR prefetch failed:', error);
    // Don't fail the page, just log and continue - client will handle the error
  }

  // Dehydrate the query cache to send to client
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <BanksWalletsClient />
    </HydrationBoundary>
  );
}