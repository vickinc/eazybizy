import { useQuery } from '@tanstack/react-query';
import { dashboardApiService, DashboardSummary } from '@/services/api/dashboardApiService';

export function useOptimizedDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApiService.getDashboardSummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes - longer cache since it's aggregated data
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false, // Don't refetch on window focus for dashboard
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export type { DashboardSummary } from '@/services/api/dashboardApiService';