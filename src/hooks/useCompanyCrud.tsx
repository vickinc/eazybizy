import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Company } from '@/types/company.types'
import { CompanyFormData } from '@/services/business/companyValidationService'
import { companyApiService } from '@/services/api'

const COMPANIES_QUERY_KEY = 'companies'

export interface CompanyCrudHook {
  // Selection State
  selectedCompanies: string[]
  setSelectedCompanies: (companies: string[]) => void
  
  // Mutation States
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isArchiving: boolean
  isUnarchiving: boolean
  isBulkOperating: boolean
  
  // CRUD Operations
  createCompany: (data: CompanyFormData & { logo?: string }) => Promise<void>
  updateCompany: (id: string, data: Partial<CompanyFormData> & { logo?: string }) => Promise<void>
  deleteCompany: (id: string) => Promise<void>
  archiveCompany: (id: string) => Promise<void>
  unarchiveCompany: (id: string, status?: 'Active' | 'Passive') => Promise<void>
  
  // Bulk Operations
  bulkUpdateStatus: (status: 'Active' | 'Passive') => Promise<void>
  bulkDelete: () => Promise<void>
  
  // Cache Management
  invalidateQueries: () => void
  refetchQueries: () => void
}

export function useCompanyCrud(): CompanyCrudHook {
  const queryClient = useQueryClient()
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  
  // Cache invalidation helpers
  const invalidateAllCompanyQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY], exact: false })
    queryClient.invalidateQueries({ queryKey: ['companies-simple'] })
  }, [queryClient])
  
  const refetchAllCompanyQueries = useCallback(() => {
    queryClient.refetchQueries({ queryKey: [COMPANIES_QUERY_KEY], exact: false })
    queryClient.refetchQueries({ queryKey: ['companies-simple'] })
  }, [queryClient])
  
  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: CompanyFormData & { logo?: string }) => 
      companyApiService.createCompany(data),
    onSuccess: () => {
      invalidateAllCompanyQueries()
      refetchAllCompanyQueries()
      toast.success('Company created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create company: ${error.message}`)
    },
  })
  
  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { 
      id: string; 
      data: Partial<CompanyFormData> & { logo?: string } 
    }) => companyApiService.updateCompany(id, data),
    onSuccess: async (result, variables) => {
      // Invalidate and refetch all company-related queries
      invalidateAllCompanyQueries()
      
      // Manually fetch fresh data to ensure UI consistency
      try {
        const freshData = await companyApiService.getCompaniesFresh({ take: 1000 })
        queryClient.setQueryData(['companies-simple'], freshData)
      } catch (error) {
        console.error('Failed to fetch fresh simple companies:', error)
      }
      
      toast.success('Company updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update company: ${error.message}`)
    },
  })
  
  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => companyApiService.deleteCompany(id),
    onSuccess: () => {
      invalidateAllCompanyQueries()
      refetchAllCompanyQueries()
      toast.success('Company deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete company: ${error.message}`)
    },
  })
  
  // Archive Mutation
  const archiveMutation = useMutation({
    mutationFn: (id: string) => companyApiService.archiveCompany(id),
    onSuccess: () => {
      invalidateAllCompanyQueries()
      refetchAllCompanyQueries()
      toast.success('Company archived successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to archive company: ${error.message}`)
    },
  })
  
  // Unarchive Mutation
  const unarchiveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status?: 'Active' | 'Passive' }) => 
      companyApiService.unarchiveCompany(id, status),
    onSuccess: () => {
      invalidateAllCompanyQueries()
      refetchAllCompanyQueries()
      toast.success('Company unarchived successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to unarchive company: ${error.message}`)
    },
  })
  
  // Bulk Update Status Mutation
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({ companies, status }: { companies: string[]; status: 'Active' | 'Passive' }) =>
      companyApiService.bulkUpdateStatus(companies, status),
    onSuccess: (result, variables) => {
      invalidateAllCompanyQueries()
      refetchAllCompanyQueries()
      setSelectedCompanies([])
      toast.success(`Updated ${variables.companies.length} company status(es)`)
    },
    onError: (error: Error) => {
      toast.error('Failed to update company statuses')
    },
  })
  
  // Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (companies: string[]) => companyApiService.bulkDelete(companies),
    onSuccess: (result, variables) => {
      invalidateAllCompanyQueries()
      refetchAllCompanyQueries()
      setSelectedCompanies([])
      toast.success(`Deleted ${variables.length} company(ies)`)
    },
    onError: (error: Error) => {
      toast.error('Failed to delete companies')
    },
  })
  
  // CRUD Operation handlers
  const createCompany = useCallback(async (data: CompanyFormData & { logo?: string }) => {
    await createMutation.mutateAsync(data)
  }, [createMutation])
  
  const updateCompany = useCallback(async (
    id: string, 
    data: Partial<CompanyFormData> & { logo?: string }
  ) => {
    await updateMutation.mutateAsync({ id, data })
  }, [updateMutation])
  
  const deleteCompany = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }, [deleteMutation])
  
  const archiveCompany = useCallback(async (id: string) => {
    await archiveMutation.mutateAsync(id)
  }, [archiveMutation])
  
  const unarchiveCompany = useCallback(async (
    id: string, 
    status: 'Active' | 'Passive' = 'Active'
  ) => {
    await unarchiveMutation.mutateAsync({ id, status })
  }, [unarchiveMutation])
  
  // Bulk operation handlers
  const bulkUpdateStatus = useCallback(async (status: 'Active' | 'Passive') => {
    if (selectedCompanies.length === 0) {
      toast.error('No companies selected')
      return
    }
    await bulkUpdateStatusMutation.mutateAsync({ companies: selectedCompanies, status })
  }, [selectedCompanies, bulkUpdateStatusMutation])
  
  const bulkDelete = useCallback(async () => {
    if (selectedCompanies.length === 0) {
      toast.error('No companies selected')
      return
    }
    if (confirm(`Are you sure you want to delete ${selectedCompanies.length} company(ies)?`)) {
      await bulkDeleteMutation.mutateAsync(selectedCompanies)
    }
  }, [selectedCompanies, bulkDeleteMutation])
  
  // Cache management
  const invalidateQueries = useCallback(() => {
    invalidateAllCompanyQueries()
  }, [invalidateAllCompanyQueries])
  
  const refetchQueries = useCallback(() => {
    refetchAllCompanyQueries()
  }, [refetchAllCompanyQueries])
  
  return {
    // Selection State
    selectedCompanies,
    setSelectedCompanies,
    
    // Mutation States
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isUnarchiving: unarchiveMutation.isPending,
    isBulkOperating: bulkUpdateStatusMutation.isPending || bulkDeleteMutation.isPending,
    
    // CRUD Operations
    createCompany,
    updateCompany,
    deleteCompany,
    archiveCompany,
    unarchiveCompany,
    
    // Bulk Operations
    bulkUpdateStatus,
    bulkDelete,
    
    // Cache Management
    invalidateQueries,
    refetchQueries,
  }
}