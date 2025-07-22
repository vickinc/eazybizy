import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TaxTreatmentsApiService, TaxTreatmentsQueryParams } from '@/services/api/taxTreatmentsApiService'
import { TaxTreatment, TaxTreatmentFormData, TaxCategory, TaxApplicability } from '@/types/taxTreatment.types'

const taxTreatmentsApiService = new TaxTreatmentsApiService()

// Query key factory
export const taxTreatmentsQueryKeys = {
  all: ['tax-treatments'] as const,
  lists: () => [...taxTreatmentsQueryKeys.all, 'list'] as const,
  list: (params: TaxTreatmentsQueryParams) => [...taxTreatmentsQueryKeys.lists(), params] as const,
  details: () => [...taxTreatmentsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...taxTreatmentsQueryKeys.details(), id] as const,
}

// Hook for getting tax treatments list
export const useTaxTreatments = (params: TaxTreatmentsQueryParams = {}) => {
  return useQuery({
    queryKey: taxTreatmentsQueryKeys.list(params),
    queryFn: () => taxTreatmentsApiService.getTaxTreatments(params),
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })
}

// Hook for getting a single tax treatment
export const useTaxTreatment = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: taxTreatmentsQueryKeys.detail(id),
    queryFn: () => taxTreatmentsApiService.getTaxTreatment(id),
    enabled: enabled && !!id,
    staleTime: 60_000, // 1 minute
  })
}

// Hook for creating tax treatment
export const useCreateTaxTreatment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TaxTreatmentFormData & { companyId?: number; isDefault?: boolean }) => 
      taxTreatmentsApiService.createTaxTreatment(data),
    onSuccess: (newTreatment) => {
      // Invalidate and refetch tax treatments lists
      queryClient.invalidateQueries({ queryKey: taxTreatmentsQueryKeys.lists() })
      
      // Add the new treatment to existing cache if it exists
      queryClient.setQueryData(
        taxTreatmentsQueryKeys.detail(newTreatment.id),
        newTreatment
      )
      
      toast.success('Tax treatment created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create tax treatment')
    },
  })
}

// Hook for updating tax treatment
export const useUpdateTaxTreatment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaxTreatmentFormData> }) =>
      taxTreatmentsApiService.updateTaxTreatment(id, data),
    onSuccess: (updatedTreatment) => {
      // Invalidate and refetch tax treatments lists
      queryClient.invalidateQueries({ queryKey: taxTreatmentsQueryKeys.lists() })
      
      // Update the specific treatment in cache
      queryClient.setQueryData(
        taxTreatmentsQueryKeys.detail(updatedTreatment.id),
        updatedTreatment
      )
      
      toast.success('Tax treatment updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update tax treatment')
    },
  })
}

// Hook for deleting tax treatment
export const useDeleteTaxTreatment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => taxTreatmentsApiService.deleteTaxTreatment(id),
    onSuccess: (_, deletedId) => {
      // Invalidate and refetch tax treatments lists
      queryClient.invalidateQueries({ queryKey: taxTreatmentsQueryKeys.lists() })
      
      // Remove the treatment from cache
      queryClient.removeQueries({ queryKey: taxTreatmentsQueryKeys.detail(deletedId) })
      
      toast.success('Tax treatment deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete tax treatment')
    },
  })
}

// Hook for bulk creating treatments (useful for initial data setup)
export const useBulkCreateTaxTreatments = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (treatments: (TaxTreatmentFormData & { companyId?: number; isDefault?: boolean })[]) =>
      taxTreatmentsApiService.bulkCreateTaxTreatments(treatments),
    onSuccess: (newTreatments) => {
      // Invalidate and refetch tax treatments lists
      queryClient.invalidateQueries({ queryKey: taxTreatmentsQueryKeys.lists() })
      
      toast.success(`${newTreatments.length} tax treatments created successfully`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create tax treatments')
    },
  })
}

// Hook for getting treatments by category
export const useTreatmentsByCategory = (category: TaxCategory, companyId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...taxTreatmentsQueryKeys.all, 'by-category', category, companyId],
    queryFn: () => taxTreatmentsApiService.getTreatmentsByCategory(category, companyId),
    enabled: enabled && !!category,
    staleTime: 60_000, // 1 minute
  })
}

// Hook for getting treatments by applicability
export const useTreatmentsByApplicability = (applicability: TaxApplicability, companyId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...taxTreatmentsQueryKeys.all, 'by-applicability', applicability, companyId],
    queryFn: () => taxTreatmentsApiService.getTreatmentsByApplicability(applicability, companyId),
    enabled: enabled && !!applicability,
    staleTime: 60_000, // 1 minute
  })
}

// Hook for searching treatments
export const useSearchTaxTreatments = (searchTerm: string, companyId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...taxTreatmentsQueryKeys.all, 'search', searchTerm, companyId],
    queryFn: () => taxTreatmentsApiService.searchTreatments(searchTerm, companyId),
    enabled: enabled && !!searchTerm && searchTerm.length >= 2, // Only search with 2+ characters
    staleTime: 30_000, // 30 seconds
  })
}

// Hook for checking treatment code uniqueness
export const useTreatmentCodeUniqueness = () => {
  return useMutation({
    mutationFn: ({ code, excludeId }: { code: string; excludeId?: string }) =>
      taxTreatmentsApiService.isTreatmentCodeUnique(code, excludeId),
  })
}

// Hook for getting active treatments
export const useActiveTreatments = (companyId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...taxTreatmentsQueryKeys.all, 'active', companyId],
    queryFn: () => taxTreatmentsApiService.getActiveTreatments(companyId),
    enabled,
    staleTime: 60_000, // 1 minute
  })
}

// Hook for getting default treatments
export const useDefaultTreatments = (enabled: boolean = true) => {
  return useQuery({
    queryKey: [...taxTreatmentsQueryKeys.all, 'defaults'],
    queryFn: () => taxTreatmentsApiService.getDefaultTreatments(),
    enabled,
    staleTime: 5 * 60_000, // 5 minutes (defaults change rarely)
  })
}

// Hook for getting treatments by rate range
export const useTreatmentsByRateRange = (minRate: number, maxRate: number, companyId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...taxTreatmentsQueryKeys.all, 'by-rate-range', minRate, maxRate, companyId],
    queryFn: () => taxTreatmentsApiService.getTreatmentsByRateRange(minRate, maxRate, companyId),
    enabled: enabled && minRate >= 0 && maxRate <= 100,
    staleTime: 60_000, // 1 minute
  })
}

// Utility hook that provides common operations
export const useTaxTreatmentsOperations = () => {
  const createTreatment = useCreateTaxTreatment()
  const updateTreatment = useUpdateTaxTreatment()
  const deleteTreatment = useDeleteTaxTreatment()
  const bulkCreateTreatments = useBulkCreateTaxTreatments()

  return {
    createTreatment,
    updateTreatment,
    deleteTreatment,
    bulkCreateTreatments,
    // Convenience methods
    createTreatmentAsync: createTreatment.mutateAsync,
    updateTreatmentAsync: updateTreatment.mutateAsync,
    deleteTreatmentAsync: deleteTreatment.mutateAsync,
    bulkCreateTreatmentsAsync: bulkCreateTreatments.mutateAsync,
    // Loading states
    isCreating: createTreatment.isPending,
    isUpdating: updateTreatment.isPending,
    isDeleting: deleteTreatment.isPending,
    isBulkCreating: bulkCreateTreatments.isPending,
    // Any operation loading
    isLoading: createTreatment.isPending || updateTreatment.isPending || 
               deleteTreatment.isPending || bulkCreateTreatments.isPending,
  }
}