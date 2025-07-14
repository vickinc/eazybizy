import React, { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Company } from '@/types/company.types'
import { companyApiService } from '@/services/api'

interface SeparatePaginationState {
  active: { skip: number; take: number }
  passive: { skip: number; take: number }
}

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
}

export function useSeparateCompanyPagination(
  searchTerm = '',
  statusFilter: 'all' | 'Active' | 'Passive' = 'all',
  industryFilter = '',
  sortField: 'legalName' | 'tradingName' | 'industry' | 'createdAt' = 'legalName',
  sortDirection: 'asc' | 'desc' = 'asc'
): SeparateCompanyPaginationHook {
  const queryClient = useQueryClient()
  
  // Separate pagination states
  const [pagination, setPagination] = useState<SeparatePaginationState>({
    active: { skip: 0, take: 6 },
    passive: { skip: 0, take: 6 }
  })

  // Query for Active companies
  const {
    data: activeData,
    isLoading: isLoadingActive,
    isError: isErrorActive,
    error: errorActive
  } = useQuery({
    queryKey: [
      'companies',
      'active',
      searchTerm,
      industryFilter,
      pagination.active.skip,
      pagination.active.take,
      sortField,
      sortDirection
    ],
    queryFn: () => companyApiService.getCompanies({
      searchTerm,
      statusFilter: 'Active',
      industryFilter,
      skip: pagination.active.skip,
      take: pagination.active.take,
      sortField,
      sortDirection,
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  })

  // Query for Passive companies  
  const {
    data: passiveData,
    isLoading: isLoadingPassive,
    isError: isErrorPassive,
    error: errorPassive
  } = useQuery({
    queryKey: [
      'companies',
      'passive', 
      searchTerm,
      industryFilter,
      pagination.passive.skip,
      pagination.passive.take,
      sortField,
      sortDirection
    ],
    queryFn: () => companyApiService.getCompanies({
      searchTerm,
      statusFilter: 'Passive',
      industryFilter,
      skip: pagination.passive.skip,
      take: pagination.passive.take,
      sortField,
      sortDirection,
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  })

  // Accumulate companies from multiple pages
  const [accumulatedActive, setAccumulatedActive] = useState<Company[]>([])
  const [accumulatedPassive, setAccumulatedPassive] = useState<Company[]>([])

  // Update accumulated companies when new data arrives
  React.useEffect(() => {
    if (!activeData) return
    
    const newCompanies = activeData.data || []
    if (pagination.active.skip === 0) {
      // Reset for new search/filter
      setAccumulatedActive(newCompanies)
    } else if (newCompanies.length > 0) {
      // Append for pagination
      setAccumulatedActive(prev => {
        const companyMap = new Map(prev.map(comp => [comp.id, comp]))
        newCompanies.forEach(comp => companyMap.set(comp.id, comp))
        return Array.from(companyMap.values())
      })
    }
  }, [activeData, pagination.active.skip])

  React.useEffect(() => {
    if (!passiveData) return
    
    const newCompanies = passiveData.data || []
    if (pagination.passive.skip === 0) {
      // Reset for new search/filter
      setAccumulatedPassive(newCompanies)
    } else if (newCompanies.length > 0) {
      // Append for pagination
      setAccumulatedPassive(prev => {
        const companyMap = new Map(prev.map(comp => [comp.id, comp]))
        newCompanies.forEach(comp => companyMap.set(comp.id, comp))
        return Array.from(companyMap.values())
      })
    }
  }, [passiveData, pagination.passive.skip])

  // Reset pagination when filters change
  React.useEffect(() => {
    setPagination({
      active: { skip: 0, take: 6 },
      passive: { skip: 0, take: 6 }
    })
    setAccumulatedActive([])
    setAccumulatedPassive([])
  }, [searchTerm, industryFilter, sortField, sortDirection])

  // Pagination actions
  const loadMoreActive = useCallback(() => {
    const currentHasMore = activeData?.pagination?.hasMore || false
    if (currentHasMore) {
      setPagination(prev => ({
        ...prev,
        active: {
          ...prev.active,
          skip: prev.active.skip + prev.active.take
        }
      }))
    }
  }, [activeData?.pagination?.hasMore])

  const loadMorePassive = useCallback(() => {
    const currentHasMore = passiveData?.pagination?.hasMore || false
    if (currentHasMore) {
      setPagination(prev => ({
        ...prev,
        passive: {
          ...prev.passive,
          skip: prev.passive.skip + prev.passive.take
        }
      }))
    }
  }, [passiveData?.pagination?.hasMore])

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['companies'], exact: false })
    setPagination({
      active: { skip: 0, take: 6 },
      passive: { skip: 0, take: 6 }
    })
    setAccumulatedActive([])
    setAccumulatedPassive([])
  }, [queryClient])

  return {
    // Data
    activeCompanies: accumulatedActive.length > 0 ? accumulatedActive : (activeData?.data || []),
    passiveCompanies: accumulatedPassive.length > 0 ? accumulatedPassive : (passiveData?.data || []),
    
    // Loading states
    isLoadingActive,
    isLoadingPassive,
    isError: isErrorActive || isErrorPassive,
    error: (errorActive || errorPassive) as Error | null,
    
    // Pagination info
    hasMoreActive: activeData?.pagination?.hasMore || false,
    hasMorePassive: passiveData?.pagination?.hasMore || false,
    
    // Actions
    loadMoreActive,
    loadMorePassive,
    invalidateQueries,
  }
}