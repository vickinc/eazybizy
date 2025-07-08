import { useQuery } from '@tanstack/react-query'
import { companyApiService } from '@/services/api'
import { Company } from '@/types/company.types'
import { companiesCache } from '@/services/cache/companiesCache'
import { useEffect } from 'react'

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  })

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
    refetch
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