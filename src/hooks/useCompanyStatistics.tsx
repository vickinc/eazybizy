import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CompanyStatistics } from '@/types/company.minimal'
import { companyApiService } from '@/services/api/companyApiService'

/**
 * Hook for loading company statistics separately from main company list
 * This prevents heavy aggregation queries from blocking the initial page load
 * 
 * Statistics are loaded after the component mounts for better perceived performance
 */
export function useCompanyStatistics() {
  const [shouldLoad, setShouldLoad] = useState(false)

  // Delay statistics loading until after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoad(true)
    }, 100) // Small delay to let main content render first

    return () => clearTimeout(timer)
  }, [])

  const {
    data: statistics,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['companies', 'statistics'],
    queryFn: () => companyApiService.getStatistics(),
    enabled: shouldLoad, // Only load after delay
    staleTime: 5 * 60 * 1000, // Statistics are fairly stable, cache for 5 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  })

  // Provide default values while loading
  const defaultStatistics: CompanyStatistics = {
    totalActive: 0,
    totalPassive: 0,
    byIndustry: {},
    newThisMonth: 0
  }

  return {
    statistics: statistics || defaultStatistics,
    isLoadingStatistics: isLoading,
    isStatisticsError: isError,
    statisticsError: error,
    refetchStatistics: refetch,
    hasStatistics: !!statistics
  }
}

/**
 * Hook for company statistics with manual trigger
 * Allows components to control when statistics are loaded
 */
export function useCompanyStatisticsManual() {
  const [enabled, setEnabled] = useState(false)

  const {
    data: statistics,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['companies', 'statistics'],
    queryFn: () => companyApiService.getStatistics(),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  })

  const loadStatistics = () => {
    setEnabled(true)
  }

  const defaultStatistics: CompanyStatistics = {
    totalActive: 0,
    totalPassive: 0,
    byIndustry: {},
    newThisMonth: 0
  }

  return {
    statistics: statistics || defaultStatistics,
    isLoadingStatistics: isLoading,
    isStatisticsError: isError,
    statisticsError: error,
    refetchStatistics: refetch,
    loadStatistics,
    hasStatistics: !!statistics
  }
}