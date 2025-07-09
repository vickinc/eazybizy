import { useQuery, useQueryClient } from '@tanstack/react-query'
import { companyApiService } from '@/services/api'
import { Company } from '@/types/company.types'
import { companiesCache } from '@/services/cache/companiesCache'
import { useEffect, useCallback } from 'react'

const COMPANIES_SIMPLE_QUERY_KEY = 'companies-simple'

/**
 * Simple hook to fetch all companies without pagination/filtering
 * Used for dropdowns, company selection, and other simple list needs
 */
export function useCompanies() {
  const {
    data: companiesResponse,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [COMPANIES_SIMPLE_QUERY_KEY],
    queryFn: () => companyApiService.getCompanies({ take: 1000 }), // Get all companies
    staleTime: 500, // 0.5 seconds for near-immediate updates
    retry: 3,
  })

  const queryClient = useQueryClient()
  
  // Cache-busted refetch for post-mutation updates
  const refetchFresh = useCallback(async () => {
    try {
      const freshData = await companyApiService.getCompaniesFresh({ take: 1000 })
      // Manually update the query cache with fresh data
      queryClient.setQueryData([COMPANIES_SIMPLE_QUERY_KEY], freshData)
      return freshData
    } catch (error) {
      console.error('Failed to fetch fresh companies:', error)
      throw error
    }
  }, [queryClient])

  const companies: Company[] = companiesResponse?.data || []
  const activeCompanies = companies.filter(company => company.status === 'Active')
  const statistics = companiesResponse?.statistics

  // Update cache when companies data changes
  useEffect(() => {
    if (companies.length > 0) {
      companiesCache.setCompanies(companies)
    }
  }, [companies])

  return {
    companies,
    activeCompanies,
    statistics,
    isLoading,
    isError,
    error,
    refetch,
    refetchFresh
  }
}

/**
 * Hook specifically for company selection dropdowns
 * Returns simplified data optimized for selection interfaces
 */
export function useCompaniesForSelection() {
  const { companies, activeCompanies, isLoading, isError } = useCompanies()

  const companyOptions = activeCompanies.map(company => ({
    id: company.id,
    label: company.tradingName,
    value: company.id.toString(),
    legalName: company.legalName,
    logo: company.logo
  }))

  return {
    companies,
    companyOptions,
    isLoading,
    isError,
    isEmpty: companyOptions.length === 0
  }
}