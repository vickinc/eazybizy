import { QueryClientConfig } from '@tanstack/react-query'

/**
 * Shared default query options for consistent behavior across server and client
 * 
 * This configuration ensures:
 * - No unnecessary refetches after SSR hydration
 * - Consistent caching behavior
 * - Optimal performance settings
 */
export const defaultQueryOptions: QueryClientConfig['defaultOptions'] = {
  queries: {
    // Data is fresh for 2 minutes - matches useCompanyQuery hook
    staleTime: 2 * 60 * 1000,
    // Cache data for 10 minutes after it becomes stale
    gcTime: 10 * 60 * 1000,
    // Retry failed requests 3 times with exponential backoff
    retry: 3,
    // Don't refetch on window focus for better performance
    refetchOnWindowFocus: false,
    // Refetch on reconnect to get latest data
    refetchOnReconnect: true,
    // Standard refetch behavior - respects staleTime
    refetchOnMount: true,
  },
  mutations: {
    // Retry failed mutations once
    retry: 1,
  },
}

/**
 * Create a QueryClient with shared default options
 * Used for both server-side prefetching and client-side providers
 */
export const createQueryClient = () => {
  return new (require('@tanstack/react-query')).QueryClient({
    defaultOptions: defaultQueryOptions,
  })
}