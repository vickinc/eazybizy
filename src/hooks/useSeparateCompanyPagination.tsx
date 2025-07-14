import { useCallback, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Company } from '@/types/company.types'
import { companyApiService } from '@/services/api'
import { useDebouncedSearch } from './useDebouncedSearch'

interface SeparateCompanyPaginationHook {
  // Data
  activeCompanies: Company[]
  passiveCompanies: Company[]
  
  // Loading states
  isLoadingActive: boolean
  isLoadingPassive: boolean
  isError: boolean
  error: Error | null
  
  // Pagination info
  hasMoreActive: boolean
  hasMorePassive: boolean
  
  // Actions
  loadMoreActive: () => void
  loadMorePassive: () => void
  invalidateQueries: () => void
  
  // Search state
  searchInput: string
  setSearchInput: (value: string) => void
  isSearching: boolean
}

// Optimized query key structure - separate stable and volatile parts
const createQueryKey = (
  status: 'Active' | 'Passive',
  debouncedSearchTerm: string,
  industryFilter: string,
  countryFilter: string,
  currencyFilter: string,
  sortField: string,
  sortDirection: string
) => [
  'companies-infinite',
  status,
  {
    search: debouncedSearchTerm,
    filters: { industryFilter, countryFilter, currencyFilter },
    sort: { sortField, sortDirection }
  }
]

export function useSeparateCompanyPagination(
  searchTerm = '',
  statusFilter: 'all' | 'Active' | 'Passive' = 'all',
  industryFilter = '',
  countryFilter = '',
  currencyFilter = '',
  sortField: 'legalName' | 'tradingName' | 'industry' | 'createdAt' | 'registrationDate' | 'countryOfRegistration' | 'baseCurrency' | 'updatedAt' = 'legalName',
  sortDirection: 'asc' | 'desc' = 'asc'
): SeparateCompanyPaginationHook {
  const queryClient = useQueryClient()
  
  // Add debounced search optimization
  const { 
    searchInput, 
    debouncedSearchTerm, 
    isSearching, 
    setSearchInput 
  } = useDebouncedSearch(searchTerm, 300) // 300ms debounce for search

  // Optimized infinite query for Active companies
  const {
    data: activeData,
    isLoading: isLoadingActive,
    isError: isErrorActive,
    error: errorActive,
    fetchNextPage: fetchNextActivePage,
    hasNextPage: hasMoreActive,
    isFetchingNextPage: isFetchingNextActivePage
  } = useInfiniteQuery({
    queryKey: createQueryKey(
      'Active',
      debouncedSearchTerm,
      industryFilter,
      countryFilter,
      currencyFilter,
      sortField,
      sortDirection
    ),
    queryFn: ({ pageParam = 0 }) => companyApiService.getCompanies({
      searchTerm: debouncedSearchTerm,
      statusFilter: 'Active',
      industryFilter,
      countryFilter,
      currencyFilter,
      skip: pageParam,
      take: 6,
      sortField,
      sortDirection,
    }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.pagination?.hasMore) return undefined
      return allPages.length * 6 // Calculate next skip value
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes  
    retry: 2,
    refetchOnWindowFocus: false,
    // Enable background refetching for better UX
    refetchOnMount: 'always'
  })

  // Optimized infinite query for Passive companies
  const {
    data: passiveData,
    isLoading: isLoadingPassive,
    isError: isErrorPassive,
    error: errorPassive,
    fetchNextPage: fetchNextPassivePage,
    hasNextPage: hasMorePassive,
    isFetchingNextPage: isFetchingNextPassivePage
  } = useInfiniteQuery({
    queryKey: createQueryKey(
      'Passive',
      debouncedSearchTerm,
      industryFilter,
      countryFilter,
      currencyFilter,
      sortField,
      sortDirection
    ),
    queryFn: ({ pageParam = 0 }) => companyApiService.getCompanies({
      searchTerm: debouncedSearchTerm,
      statusFilter: 'Passive',
      industryFilter,
      countryFilter,
      currencyFilter,
      skip: pageParam,
      take: 6,
      sortField,
      sortDirection,
    }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.pagination?.hasMore) return undefined
      return allPages.length * 6 // Calculate next skip value
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    // Enable background refetching for better UX
    refetchOnMount: 'always'
  })

  // Memoized flattened company arrays - much more efficient than manual accumulation
  const activeCompanies = useMemo(() => {
    return activeData?.pages?.flatMap(page => page.data || []) || []
  }, [activeData?.pages])

  const passiveCompanies = useMemo(() => {
    return passiveData?.pages?.flatMap(page => page.data || []) || []
  }, [passiveData?.pages])

  // Optimized load more functions with loading states
  const loadMoreActive = useCallback(() => {
    if (hasMoreActive && !isFetchingNextActivePage) {
      fetchNextActivePage()
    }
  }, [hasMoreActive, isFetchingNextActivePage, fetchNextActivePage])

  const loadMorePassive = useCallback(() => {
    if (hasMorePassive && !isFetchingNextPassivePage) {
      fetchNextPassivePage()
    }
  }, [hasMorePassive, isFetchingNextPassivePage, fetchNextPassivePage])

  // More targeted cache invalidation
  const invalidateQueries = useCallback(() => {
    // Only invalidate company-related infinite queries
    queryClient.invalidateQueries({ 
      queryKey: ['companies-infinite'], 
      exact: false 
    })
  }, [queryClient])

  return {
    // Data - using React Query's built-in infinite data handling
    activeCompanies,
    passiveCompanies,
    
    // Loading states - includes fetching next page states
    isLoadingActive: isLoadingActive || isFetchingNextActivePage,
    isLoadingPassive: isLoadingPassive || isFetchingNextPassivePage,
    isError: isErrorActive || isErrorPassive,
    error: (errorActive || errorPassive) as Error | null,
    
    // Pagination info from React Query's infinite query
    hasMoreActive: hasMoreActive || false,
    hasMorePassive: hasMorePassive || false,
    
    // Actions
    loadMoreActive,
    loadMorePassive,
    invalidateQueries,
    
    // Search state for UI binding
    searchInput,
    setSearchInput,
    isSearching
  }
}