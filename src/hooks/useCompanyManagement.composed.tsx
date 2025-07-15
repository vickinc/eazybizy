import { useCallback } from 'react'
import { Company } from '@/types/company.types'
import { useCompanyQuery } from './useCompanyQuery'
import { useCompanyFilters } from './useCompanyFilters'
import { useCompanyCrud } from './useCompanyCrud'
import { useCompanyForm } from './useCompanyForm'

export interface ComposedCompanyManagementHook {
  // Data with loading states (from useCompanyQuery)
  companies: Company[]
  isCompaniesLoading: boolean
  isCompaniesError: boolean
  companiesError: Error | null
  
  // Formatted data (from useCompanyQuery)
  formattedCompanies: Company[]
  activeCompanies: Company[]
  passiveCompanies: Company[]
  availableIndustries: string[]
  
  // Pagination (from useCompanyQuery)
  pagination: {
    skip: number
    take: number
    total: number
    hasMore: boolean
  }
  
  // Statistics (from useCompanyQuery)
  statistics: {
    totalActive: number
    totalPassive: number
    byIndustry: Record<string, number>
    newThisMonth: number
  } | undefined
  
  // Filter state (from useCompanyFilters)
  filters: {
    searchTerm: string
    statusFilter: 'all' | 'Active' | 'Passive'
    industryFilter: string
  }
  
  // Sorting state (from useCompanyFilters)
  sortField: 'legalName' | 'tradingName' | 'industry' | 'createdAt'
  sortDirection: 'asc' | 'desc'
  
  // Form state (from useCompanyForm)
  formData: any
  logoFile: string | null
  logoPreview: string | null
  
  // UI state (centralized)
  uiState: any
  
  // Copy state (from centralized UI state)
  copiedFields: { [key: string]: boolean }
  
  // Filter state with search
  searchInput: string
  isSearching: boolean
  hasActiveSearch: boolean
  
  // Mutation states (from useCompanyCrud)
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isArchiving: boolean
  isUnarchiving: boolean
  isBulkOperating: boolean
  
  // Filter actions (from useCompanyFilters)
  updateFilters: (newFilters: Partial<any>) => void
  setSorting: (field: any, direction?: any) => void
  resetFilters: () => void
  setSearchInput: (value: string) => void
  clearSearch: () => void
  
  // Pagination actions (from useCompanyQuery)
  loadMore: () => void
  resetPagination: () => void
  
  // Query management
  invalidateQuery: () => void
  
  // Form actions (from useCompanyForm)
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleStatusChange: (value: string) => void
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeLogo: () => void
  resetForm: () => void
  
  // Dialog management (via uiState)
  closeDialog: () => void
  
  // CRUD operations (from useCompanyCrud)
  createCompany: () => Promise<void>
  updateCompany: () => Promise<void>
  deleteCompany: (id: string) => Promise<void>
  archiveCompany: (id: string) => Promise<void>
  unarchiveCompany: (id: string, status?: 'Active' | 'Passive') => Promise<void>
  
  // Form management actions (from useCompanyForm)
  handleSubmit: (e: React.FormEvent) => void
  handleEdit: (company: Company) => void
  handleDelete: (id: number) => void
  handleArchive: (company: Company) => void
  handleUnarchive: (company: Company) => void
  handleAddNew: () => void
  
  // Selection actions (via centralized state)
  setSelectedCompanies: (companies: string[]) => void
  
  // Bulk operations (from useCompanyCrud)
  bulkUpdateStatus: (status: 'Active' | 'Passive') => Promise<void>
  bulkDelete: () => Promise<void>
  
  // Utility actions (from useCompanyForm)
  copyToClipboard: (text: string, fieldName: string, companyId: number) => Promise<void>
  handleWebsiteClick: (website: string, e: React.MouseEvent) => void
}

/**
 * Composed hook that brings together all company management functionality
 * by combining focused hooks with single responsibilities.
 * 
 * This provides the same interface as the original useCompanyManagement hook
 * but with better separation of concerns and testability.
 */
export function useCompanyManagementComposed(): ComposedCompanyManagementHook {
  // Initialize all focused hooks
  const filters = useCompanyFilters()
  const query = useCompanyQuery(filters.filters, filters.sorting)
  const crud = useCompanyCrud()
  const form = useCompanyForm()
  
  // Create composed CRUD operations that integrate with form validation
  const createCompany = useCallback(async () => {
    if (!form.validateForm()) return
    const data = form.getFormDataWithLogo()
    await crud.createCompany(data)
    form.resetForm()
  }, [form, crud])
  
  const updateCompany = useCallback(async () => {
    if (!form.editingCompany) return
    if (!form.validateForm()) return
    const data = form.getFormDataWithLogo()
    await crud.updateCompany(form.editingCompany.id.toString(), data)
    form.resetForm()
  }, [form, crud])
  
  // Form management actions that integrate form with crud operations
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (form.editingCompany) {
      updateCompany()
    } else {
      createCompany()
    }
  }, [form.editingCompany, updateCompany, createCompany])
  
  const handleDelete = useCallback((id: number) => {
    if (confirm("Are you sure you want to delete this company?")) {
      crud.deleteCompany(id.toString())
    }
  }, [crud])
  
  const handleArchive = useCallback((company: Company) => {
    crud.archiveCompany(company.id.toString())
  }, [crud])
  
  const handleUnarchive = useCallback((company: Company) => {
    crud.unarchiveCompany(company.id.toString(), 'Active')
  }, [crud])
  
  return {
    // Data with loading states
    companies: query.companies,
    isCompaniesLoading: query.isLoading,
    isCompaniesError: query.isError,
    companiesError: query.error,
    
    // Formatted data
    formattedCompanies: query.formattedCompanies,
    activeCompanies: query.activeCompanies,
    passiveCompanies: query.passiveCompanies,
    availableIndustries: query.availableIndustries,
    
    // Pagination
    pagination: query.pagination,
    
    // Statistics
    statistics: query.statistics,
    
    // Filter state
    filters: filters.filters,
    
    // Sorting state
    sortField: filters.sorting.sortField,
    sortDirection: filters.sorting.sortDirection,
    
    // Search state
    searchInput: filters.searchInput,
    isSearching: filters.isSearching,
    hasActiveSearch: filters.hasActiveSearch,
    
    // Form state
    formData: form.formData,
    logoFile: form.logoFile,
    logoPreview: form.logoPreview,
    
    // UI state (centralized)
    uiState: form.uiState,
    
    // Copy state (from centralized UI state)
    copiedFields: form.uiState.state.copiedFields,
    
    // Mutation states
    isCreating: crud.isCreating,
    isUpdating: crud.isUpdating,
    isDeleting: crud.isDeleting,
    isArchiving: crud.isArchiving,
    isUnarchiving: crud.isUnarchiving,
    isBulkOperating: crud.isBulkOperating,
    
    // Filter actions
    updateFilters: filters.updateFilters,
    setSorting: filters.setSorting,
    resetFilters: filters.resetFilters,
    setSearchInput: filters.setSearchInput,
    clearSearch: filters.clearSearch,
    
    // Pagination actions
    loadMore: query.loadMore,
    resetPagination: query.resetPagination,
    
    // Query management
    invalidateQuery: query.invalidateQuery,
    
    // Form actions
    handleInputChange: form.handleInputChange,
    handleStatusChange: form.handleStatusChange,
    handleLogoUpload: form.handleLogoUpload,
    removeLogo: form.removeLogo,
    resetForm: form.resetForm,
    
    // Dialog management
    closeDialog: form.closeDialog,
    
    // CRUD operations
    createCompany,
    updateCompany,
    deleteCompany: crud.deleteCompany,
    archiveCompany: crud.archiveCompany,
    unarchiveCompany: crud.unarchiveCompany,
    
    // Form management actions
    handleSubmit,
    handleEdit: form.handleEdit,
    handleDelete,
    handleArchive,
    handleUnarchive,
    handleAddNew: form.handleAddNew,
    
    // Selection actions
    setSelectedCompanies: form.uiState.setSelectedCompanies,
    
    // Bulk operations
    bulkUpdateStatus: crud.bulkUpdateStatus,
    bulkDelete: crud.bulkDelete,
    
    // Utility actions
    copyToClipboard: form.copyToClipboard,
    handleWebsiteClick: form.handleWebsiteClick,
  }
}