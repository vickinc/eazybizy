import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Company } from '@/types/company.types'
import { 
  companyApiService,
  CompanyQueryParams 
} from '@/services/api'
import { CompanyBusinessService } from '@/services/business/companyBusinessService'

const COMPANIES_QUERY_KEY = 'companies'

export interface CompanyQueryFilters {
  searchTerm: string
  statusFilter: 'all' | 'Active' | 'Passive'
  industryFilter: string
}

export interface CompanyQuerySorting {
  sortField: 'legalName' | 'tradingName' | 'industry' | 'createdAt'
  sortDirection: 'asc' | 'desc'
}

export interface CompanyQueryPagination {
  skip: number
  take: number
}

export interface CompanyQueryHook {
  // Raw Data
  companies: Company[]
  statistics: {
    totalActive: number
    totalPassive: number
    byIndustry: Record<string, number>
    newThisMonth: number
  } | undefined
  pagination: {
    skip: number
    take: number
    total: number
    hasMore: boolean
  }
  
  // Loading States
  isLoading: boolean
  isError: boolean
  error: Error | null
  
  // Formatted Data
  formattedCompanies: Company[]
  activeCompanies: Company[]
  passiveCompanies: Company[]
  availableIndustries: string[]
  
  // Pagination Actions
  loadMore: () => void
  resetPagination: () => void
  
  // Invalidation
  invalidateQuery: () => void
  refetchQuery: () => void
}

export function useCompanyQuery(
  filters: CompanyQueryFilters,
  sorting: CompanyQuerySorting,
  initialPagination: CompanyQueryPagination = { skip: 0, take: 6 }
): CompanyQueryHook {
  // Query client for invalidation
  const queryClient = useQueryClient()
  
  // Pagination state
  const [pagination, setPagination] = useState<CompanyQueryPagination>(initialPagination)
  const [accumulatedCompanies, setAccumulatedCompanies] = useState<Company[]>([])
  
  // Build query parameters with stable key generation
  const queryParams: CompanyQueryParams = useMemo(() => ({
    ...filters,
    ...pagination,
    ...sorting,
  }), [filters, pagination, sorting])
  
  // Stable query key using primitive values to prevent subtle cache misses
  const stableQueryKey = useMemo(() => {
    // Use primitive values in array format for better stability and debuggability
    return [
      COMPANIES_QUERY_KEY,
      filters.searchTerm,
      filters.statusFilter,
      filters.industryFilter,
      pagination.skip,
      pagination.take,
      sorting.sortField,
      sorting.sortDirection
    ]
  }, [
    filters.searchTerm,
    filters.statusFilter, 
    filters.industryFilter,
    pagination.skip,
    pagination.take,
    sorting.sortField,
    sorting.sortDirection
  ])
  
  // Companies Query with optimized caching
  const {
    data: companiesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: stableQueryKey,
    queryFn: () => companyApiService.getCompanies(queryParams),
    staleTime: 2 * 60 * 1000, // 2 minutes - balance between freshness and performance
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false, // Don't refetch on window focus for better UX
    refetchOnMount: true, // Standard refetch behavior - respects staleTime
    placeholderData: (previousData) => previousData, // Keep previous data while loading new data
  })
  
  // Extract data from responses
  const statistics = companiesResponse?.statistics
  const paginationData = companiesResponse?.pagination || { 
    skip: 0, 
    take: 6, 
    total: 0, 
    hasMore: false 
  }
  
  // Update accumulated companies when new data arrives
  useEffect(() => {
    if (!companiesResponse) return
    
    const newCompanies = companiesResponse.data || []
    const responsePagination = companiesResponse.pagination || { skip: 0, take: 6, total: 0, hasMore: false }
    
    if (responsePagination.skip === 0) {
      // Reset accumulated data when starting fresh (filters changed or first load)
      setAccumulatedCompanies(newCompanies)
    } else if (newCompanies.length > 0) {
      // Append new companies to existing ones for pagination
      setAccumulatedCompanies(prev => {
        const companyMap = new Map(prev.map(comp => [comp.id, comp]))
        newCompanies.forEach(comp => companyMap.set(comp.id, comp))
        return Array.from(companyMap.values())
      })
    }
  }, [companiesResponse])
  
  // Reset pagination when filters or sorting change (but don't clear data immediately)
  useEffect(() => {
    setPagination({ skip: 0, take: 6 })
    // Don't clear accumulated companies here - let the next query response handle it
  }, [filters.searchTerm, filters.statusFilter, filters.industryFilter, sorting.sortField, sorting.sortDirection])
  
  // Use accumulated companies, but fallback to fresh data if empty
  const companies = accumulatedCompanies.length > 0 ? accumulatedCompanies : (companiesResponse?.data || [])
  
  
  // Compute derived data using business services
  const availableIndustries = useMemo(() => {
    return [...new Set(companies.map(comp => comp.industry))].sort()
  }, [companies])
  
  // Format companies for display
  const formattedCompanies = useMemo(() => {
    return CompanyBusinessService.formatCompaniesForDisplay(companies)
  }, [companies])
  
  const activeCompanies = useMemo(() => {
    return CompanyBusinessService.filterCompaniesByStatus(formattedCompanies, 'Active')
  }, [formattedCompanies])
  
  const passiveCompanies = useMemo(() => {
    return CompanyBusinessService.filterCompaniesByStatus(formattedCompanies, 'Passive')
  }, [formattedCompanies])
  
  // Pagination actions
  const loadMore = useCallback(() => {
    setPagination(prev => {
      // Only increment if there's more data available
      const currentHasMore = companiesResponse?.pagination?.hasMore || false
      if (currentHasMore) {
        // Load more companies in chunks of 10 for better UX after initial load
        const loadMoreSize = 10
        return { ...prev, skip: prev.skip + prev.take, take: loadMoreSize }
      }
      return prev
    })
  }, [companiesResponse?.pagination?.hasMore])
  
  const resetPagination = useCallback(() => {
    setPagination({ skip: 0, take: 6 })
    setAccumulatedCompanies([])
  }, [])
  
  // Query management with smart invalidation
  const invalidateQuery = useCallback(() => {
    // Only reset pagination, keep accumulated companies to avoid flash of empty state
    setPagination({ skip: 0, take: 6 })
    // Invalidate React Query cache - this will trigger a refetch
    queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY], exact: false })
  }, [queryClient])
  
  const refetchQuery = useCallback(() => {
    refetch()
  }, [refetch])
  
  return {
    // Raw Data
    companies,
    statistics,
    pagination: paginationData,
    
    // Loading States
    isLoading,
    isError,
    error: error as Error | null,
    
    // Formatted Data
    formattedCompanies,
    activeCompanies,
    passiveCompanies,
    availableIndustries,
    
    // Pagination Actions
    loadMore,
    resetPagination,
    
    // Query Management
    invalidateQuery,
    refetchQuery,
  }
}