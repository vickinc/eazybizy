import { useState, useCallback, useEffect } from 'react'
import { useDebouncedSearch } from './useDebouncedSearch'

export interface CompanyFilters {
  searchTerm: string
  statusFilter: 'all' | 'Active' | 'Passive'
  industryFilter: string
}

export interface CompanySorting {
  sortField: 'legalName' | 'tradingName' | 'industry' | 'createdAt' | 'updatedAt'
  sortDirection: 'asc' | 'desc'
}

export interface CompanyFiltersHook {
  // Filter State
  filters: CompanyFilters
  
  // Sorting State
  sorting: CompanySorting
  
  // Search State (immediate for UI, debounced for API)
  searchInput: string
  isSearching: boolean
  hasActiveSearch: boolean
  
  // Filter Actions
  updateFilters: (newFilters: Partial<CompanyFilters>) => void
  resetFilters: () => void
  setSearchInput: (term: string) => void
  setStatusFilter: (status: CompanyFilters['statusFilter']) => void
  setIndustryFilter: (industry: string) => void
  clearSearch: () => void
  
  // Sorting Actions
  setSorting: (field: CompanySorting['sortField'], direction?: CompanySorting['sortDirection']) => void
  toggleSortDirection: (field: CompanySorting['sortField']) => void
  resetSorting: () => void
  
  // Combined Actions
  resetAll: () => void
}

const initialFilters: CompanyFilters = {
  searchTerm: '',
  statusFilter: 'all',
  industryFilter: '',
}

const initialSorting: CompanySorting = {
  sortField: 'updatedAt',
  sortDirection: 'desc',
}

export function useCompanyFilters(): CompanyFiltersHook {
  const [filters, setFilters] = useState<CompanyFilters>(initialFilters)
  const [sorting, setSortingState] = useState<CompanySorting>(initialSorting)
  
  // Debounced search hook
  const { 
    searchInput, 
    debouncedSearchTerm, 
    isSearching, 
    setSearchInput, 
    clearSearch,
    hasActiveSearch 
  } = useDebouncedSearch('', 250)
  
  // Update filters when debounced search term changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, searchTerm: debouncedSearchTerm }))
  }, [debouncedSearchTerm])
  
  // Filter actions
  const updateFilters = useCallback((newFilters: Partial<CompanyFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])
  
  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
    clearSearch()
  }, [clearSearch])
  
  const setStatusFilter = useCallback((status: CompanyFilters['statusFilter']) => {
    setFilters(prev => ({ ...prev, statusFilter: status }))
  }, [])
  
  const setIndustryFilter = useCallback((industry: string) => {
    setFilters(prev => ({ ...prev, industryFilter: industry }))
  }, [])
  
  // Sorting actions
  const setSorting = useCallback((
    field: CompanySorting['sortField'], 
    direction?: CompanySorting['sortDirection']
  ) => {
    setSortingState(prev => {
      const newDirection = direction || (prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc')
      return {
        sortField: field,
        sortDirection: newDirection
      }
    })
  }, [])
  
  const toggleSortDirection = useCallback((field: CompanySorting['sortField']) => {
    setSortingState(prev => ({
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }))
  }, [])
  
  const resetSorting = useCallback(() => {
    setSortingState(initialSorting)
  }, [])
  
  // Combined actions
  const resetAll = useCallback(() => {
    setFilters(initialFilters)
    setSortingState(initialSorting)
    clearSearch()
  }, [clearSearch])
  
  return {
    // State
    filters,
    sorting,
    
    // Search State
    searchInput,
    isSearching,
    hasActiveSearch,
    
    // Filter Actions
    updateFilters,
    resetFilters,
    setSearchInput,
    setStatusFilter,
    setIndustryFilter,
    clearSearch,
    
    // Sorting Actions
    setSorting,
    toggleSortDirection,
    resetSorting,
    
    // Combined Actions
    resetAll,
  }
}