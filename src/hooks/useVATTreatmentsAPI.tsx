import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { VATTreatmentsApiService, VATTreatmentsQueryParams } from '@/services/api/vatTreatmentsApiService'
import { VATTreatment, VATTreatmentFormData, VATCategory, VATApplicability } from '@/types/vatTreatment.types'

const vatTreatmentsApiService = new VATTreatmentsApiService()

// Query key factory
export const vatTreatmentsQueryKeys = {
  all: ['vat-treatments'] as const,
  lists: () => [...vatTreatmentsQueryKeys.all, 'list'] as const,
  list: (params: VATTreatmentsQueryParams) => [...vatTreatmentsQueryKeys.lists(), params] as const,
  details: () => [...vatTreatmentsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...vatTreatmentsQueryKeys.details(), id] as const,
}

// Hook for getting VAT treatments list
export const useVATTreatments = (params: VATTreatmentsQueryParams = {}) => {
  return useQuery({
    queryKey: vatTreatmentsQueryKeys.list(params),
    queryFn: () => vatTreatmentsApiService.getVATTreatments(params),
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })
}

// Hook for getting a single VAT treatment
export const useVATTreatment = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: vatTreatmentsQueryKeys.detail(id),
    queryFn: () => vatTreatmentsApiService.getVATTreatment(id),
    enabled: enabled && !!id,
    staleTime: 60_000, // 1 minute
  })
}

// Hook for creating VAT treatment
export const useCreateVATTreatment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: VATTreatmentFormData & { companyId?: number; isDefault?: boolean }) => 
      vatTreatmentsApiService.createVATTreatment(data),
    onSuccess: (newTreatment) => {
      // Invalidate and refetch VAT treatments lists
      queryClient.invalidateQueries({ queryKey: vatTreatmentsQueryKeys.lists() })
      
      // Add the new treatment to existing cache if it exists
      queryClient.setQueryData(
        vatTreatmentsQueryKeys.detail(newTreatment.id),
        newTreatment
      )
      
      toast.success('VAT treatment created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create VAT treatment')
    },
  })
}

// Hook for updating VAT treatment
export const useUpdateVATTreatment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VATTreatmentFormData> }) =>
      vatTreatmentsApiService.updateVATTreatment(id, data),
    onSuccess: (updatedTreatment) => {
      // Invalidate and refetch VAT treatments lists
      queryClient.invalidateQueries({ queryKey: vatTreatmentsQueryKeys.lists() })
      
      // Update the specific treatment in cache
      queryClient.setQueryData(
        vatTreatmentsQueryKeys.detail(updatedTreatment.id),
        updatedTreatment
      )
      
      toast.success('VAT treatment updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update VAT treatment')
    },
  })
}

// Hook for deleting VAT treatment
export const useDeleteVATTreatment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => vatTreatmentsApiService.deleteVATTreatment(id),
    onSuccess: (_, deletedId) => {
      // Invalidate and refetch VAT treatments lists
      queryClient.invalidateQueries({ queryKey: vatTreatmentsQueryKeys.lists() })
      
      // Remove the treatment from cache
      queryClient.removeQueries({ queryKey: vatTreatmentsQueryKeys.detail(deletedId) })
      
      toast.success('VAT treatment deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete VAT treatment')
    },
  })
}

// Hook for bulk creating treatments (useful for initial data setup)
export const useBulkCreateVATTreatments = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (treatments: (VATTreatmentFormData & { companyId?: number; isDefault?: boolean })[]) =>
      vatTreatmentsApiService.bulkCreateVATTreatments(treatments),
    onSuccess: (newTreatments) => {
      // Invalidate and refetch VAT treatments lists
      queryClient.invalidateQueries({ queryKey: vatTreatmentsQueryKeys.lists() })
      
      toast.success(`${newTreatments.length} VAT treatments created successfully`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create VAT treatments')
    },
  })
}

// Hook for getting treatments by category
export const useTreatmentsByCategory = (category: VATCategory, companyId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...vatTreatmentsQueryKeys.all, 'by-category', category, companyId],
    queryFn: () => vatTreatmentsApiService.getTreatmentsByCategory(category, companyId),
    enabled: enabled && !!category,
    staleTime: 60_000, // 1 minute
  })
}

// Hook for getting treatments by applicability
export const useTreatmentsByApplicability = (applicability: VATApplicability, companyId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...vatTreatmentsQueryKeys.all, 'by-applicability', applicability, companyId],
    queryFn: () => vatTreatmentsApiService.getTreatmentsByApplicability(applicability, companyId),
    enabled: enabled && !!applicability,
    staleTime: 60_000, // 1 minute
  })
}

// Hook for searching treatments
export const useSearchVATTreatments = (searchTerm: string, companyId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...vatTreatmentsQueryKeys.all, 'search', searchTerm, companyId],
    queryFn: () => vatTreatmentsApiService.searchTreatments(searchTerm, companyId),
    enabled: enabled && !!searchTerm && searchTerm.length >= 2, // Only search with 2+ characters
    staleTime: 30_000, // 30 seconds
  })
}

// Hook for checking treatment code uniqueness
export const useTreatmentCodeUniqueness = () => {
  return useMutation({
    mutationFn: ({ code, excludeId }: { code: string; excludeId?: string }) =>
      vatTreatmentsApiService.isTreatmentCodeUnique(code, excludeId),
  })
}

// Hook for getting active treatments
export const useActiveTreatments = (companyId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...vatTreatmentsQueryKeys.all, 'active', companyId],
    queryFn: () => vatTreatmentsApiService.getActiveTreatments(companyId),
    enabled,
    staleTime: 60_000, // 1 minute
  })
}

// Hook for getting default treatments
export const useDefaultTreatments = (enabled: boolean = true) => {
  return useQuery({
    queryKey: [...vatTreatmentsQueryKeys.all, 'defaults'],
    queryFn: () => vatTreatmentsApiService.getDefaultTreatments(),
    enabled,
    staleTime: 5 * 60_000, // 5 minutes (defaults change rarely)
  })
}

// Hook for getting treatments by rate range
export const useTreatmentsByRateRange = (minRate: number, maxRate: number, companyId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...vatTreatmentsQueryKeys.all, 'by-rate-range', minRate, maxRate, companyId],
    queryFn: () => vatTreatmentsApiService.getTreatmentsByRateRange(minRate, maxRate, companyId),
    enabled: enabled && minRate >= 0 && maxRate <= 100,
    staleTime: 60_000, // 1 minute
  })
}

// Utility hook that provides common operations
export const useVATTreatmentsOperations = () => {
  const createTreatment = useCreateVATTreatment()
  const updateTreatment = useUpdateVATTreatment()
  const deleteTreatment = useDeleteVATTreatment()
  const bulkCreateTreatments = useBulkCreateVATTreatments()

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