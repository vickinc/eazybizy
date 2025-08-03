import { redirect } from 'next/navigation';
import { authenticateRequest } from '@/lib/api-auth';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import { CashflowSSRService } from '@/services/database/cashflowSSRService';
import { CompanySSRService } from '@/services/database/companySSRService';
import { defaultQueryOptions } from '@/lib/queryOptions';
import CashflowClient from './CashflowClient';

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function CashflowPage() {
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

  // Comprehensive server-side data pre-fetching for optimal performance
  // Execute multiple queries in parallel for maximum efficiency
  try {
    console.log('[CashflowPage] Starting comprehensive SSR data prefetch...');
    
    // Execute all data fetching operations in parallel for optimal performance
    const [
      // Core cashflow data with larger initial dataset
      cashflowData,
      // Companies data for context and filtering
      companiesData,
      // Additional cashflow data for different periods (cache warming)
      thisMonthData,
      lastMonthData,
      thisYearData
    ] = await Promise.allSettled([
      // Primary cashflow data with more comprehensive initial load
      CashflowSSRService.getCashflowDataForSSR({
        companyId: 'all',
        take: 50, // Increased from 10 to 50 for better initial experience
        period: undefined,
      }),
      
      // Companies data for dropdown and context
      CompanySSRService.getCompaniesForSSR({
        skip: 0,
        take: 100, // All companies for filter dropdown
        searchTerm: '',
        status: 'Active',
        sortField: 'updatedAt',
        sortDirection: 'desc'
      }),
      
      // Cache warming: Pre-fetch common period filters
      CashflowSSRService.getCashflowDataForSSR({
        companyId: 'all',
        take: 30,
        period: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
      }),
      
      CashflowSSRService.getCashflowDataForSSR({
        companyId: 'all',
        take: 30,
        period: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7), // Last month
      }),
      
      CashflowSSRService.getCashflowDataForSSR({
        companyId: 'all',
        take: 50,
        periodFrom: new Date(new Date().getFullYear(), 0, 1).toISOString(), // This year start
        periodTo: new Date().toISOString(), // Now
      })
    ]);

    // Handle primary cashflow data
    if (cashflowData.status === 'fulfilled') {
      const data = cashflowData.value;
      
      // Prefetch main dataset with larger cache
      queryClient.setQueryData(
        ['transactions', 'all'],
        {
          data: data.transactions,
          total: data.transactions.length
        }
      );

      queryClient.setQueryData(
        ['bank-accounts', 'all'],
        {
          data: data.bankAccounts,
          total: data.bankAccounts.length
        }
      );

      queryClient.setQueryData(
        ['digital-wallets', 'all'],
        {
          data: data.digitalWallets,
          total: data.digitalWallets.length
        }
      );

      queryClient.setQueryData(
        ['manual-cashflow-entries', 'all'],
        {
          data: data.manualEntries,
          total: data.manualEntries.length
        }
      );

      queryClient.setQueryData(
        ['cashflow-summary', 'all'],
        data.summary
      );

      // Additional prefetching for common query patterns
      queryClient.setQueryData(
        ['cashflow-data', 'all', 'full'],
        data
      );

      console.log(`[CashflowPage] Primary data prefetched: ${data.transactions.length} transactions, ${data.bankAccounts.length} banks, ${data.digitalWallets.length} wallets, ${data.manualEntries.length} manual entries`);
    } else {
      console.error('[CashflowPage] Primary cashflow data prefetch failed:', cashflowData.reason);
    }

    // Handle companies data
    if (companiesData.status === 'fulfilled') {
      const companies = companiesData.value;
      
      queryClient.setQueryData(
        ['companies', { searchTerm: '', status: 'Active' }],
        {
          data: companies.data,
          total: companies.total,
          pagination: companies.pagination
        }
      );

      // Prefetch for company filter dropdown
      queryClient.setQueryData(
        ['companies', 'fast'],
        {
          data: companies.data,
          total: companies.total
        }
      );

      console.log(`[CashflowPage] Companies data prefetched: ${companies.data.length} companies`);
    } else {
      console.error('[CashflowPage] Companies data prefetch failed:', companiesData.reason);
    }

    // Handle period-specific data for cache warming
    const periodResults = [
      { data: thisMonthData, period: 'thisMonth' },
      { data: lastMonthData, period: 'lastMonth' },
      { data: thisYearData, period: 'thisYear' }
    ];

    periodResults.forEach(({ data, period }) => {
      if (data.status === 'fulfilled') {
        // Cache period-specific summary data
        queryClient.setQueryData(
          ['cashflow-summary', 'all', period],
          data.value.summary
        );

        // Cache period-specific transaction counts
        queryClient.setQueryData(
          ['cashflow-period-data', 'all', period],
          {
            transactionCount: data.value.transactions.length,
            manualEntryCount: data.value.manualEntries.length,
            summary: data.value.summary
          }
        );

        console.log(`[CashflowPage] ${period} data cached: ${data.value.transactions.length} transactions`);
      } else {
        console.warn(`[CashflowPage] ${period} data prefetch failed:`, data.reason);
      }
    });

    // Additional performance optimizations
    // Prefetch related query patterns that users commonly access
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    const lastMonth = new Date(currentDate.setMonth(currentDate.getMonth() - 1)).toISOString().slice(0, 7);

    // Cache common filter combinations
    const commonFilters = [
      { viewFilter: 'all', filterBy: 'all' },
      { viewFilter: 'automatic', filterBy: 'all' },
      { viewFilter: 'manual', filterBy: 'all' },
      { viewFilter: 'all', filterBy: 'banks' },
      { viewFilter: 'all', filterBy: 'wallets' }
    ];

    commonFilters.forEach(filter => {
      queryClient.setQueryData(
        ['cashflow-filtered-data', 'all', filter],
        null // Placeholder to indicate this query pattern is expected
      );
    });

    const totalPrefetchTime = Date.now() - startTime;
    console.log(`[CashflowPage] Comprehensive SSR prefetch completed in ${totalPrefetchTime}ms with optimized caching`);

    // Background cache warming for future requests (don't await this)
    CashflowSSRService.warmCashflowCache('all').catch(error => {
      console.warn('[CashflowPage] Background cache warming failed:', error);
    });
    
  } catch (error) {
    console.error('[CashflowPage] SSR prefetch failed:', error);
    // Don't fail the page, just log and continue - client will handle the error
  }

  // Dehydrate the query cache to send to client
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <CashflowClient />
    </HydrationBoundary>
  );
} 