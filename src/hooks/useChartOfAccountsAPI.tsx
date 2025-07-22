import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChartOfAccountsApiService, ChartOfAccountsQueryParams } from '@/services/api/chartOfAccountsApiService'
import { ChartOfAccount, ChartOfAccountFormData } from '@/types/chartOfAccounts.types'

const chartOfAccountsApiService = new ChartOfAccountsApiService()

// Query key factory
export const chartOfAccountsQueryKeys = {
  all: ['chart-of-accounts'] as const,
  lists: () => [...chartOfAccountsQueryKeys.all, 'list'] as const,
  list: (params: ChartOfAccountsQueryParams) => [...chartOfAccountsQueryKeys.lists(), params] as const,
  details: () => [...chartOfAccountsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...chartOfAccountsQueryKeys.details(), id] as const,
}

// Hook for getting chart of accounts list
export const useChartOfAccounts = (params: ChartOfAccountsQueryParams = {}) => {
  return useQuery({
    queryKey: chartOfAccountsQueryKeys.list(params),
    queryFn: () => chartOfAccountsApiService.getChartOfAccounts(params),
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })
}

// Hook for getting a single chart of account
export const useChartOfAccount = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: chartOfAccountsQueryKeys.detail(id),
    queryFn: () => chartOfAccountsApiService.getChartOfAccount(id),
    enabled: enabled && !!id,
    staleTime: 60_000, // 1 minute
  })
}

// Hook for creating chart of account
export const useCreateChartOfAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ChartOfAccountFormData & { companyId?: number }) => 
      chartOfAccountsApiService.createChartOfAccount(data),
    onSuccess: (newAccount) => {
      // Invalidate and refetch chart of accounts lists
      queryClient.invalidateQueries({ queryKey: chartOfAccountsQueryKeys.lists() })
      
      // Add the new account to existing cache if it exists
      queryClient.setQueryData(
        chartOfAccountsQueryKeys.detail(newAccount.id),
        newAccount
      )
      
      toast.success('Account created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create account')
    },
  })
}

// Hook for updating chart of account
export const useUpdateChartOfAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ChartOfAccountFormData> }) =>
      chartOfAccountsApiService.updateChartOfAccount(id, data),
    onSuccess: (updatedAccount) => {
      // Invalidate and refetch chart of accounts lists
      queryClient.invalidateQueries({ queryKey: chartOfAccountsQueryKeys.lists() })
      
      // Update the specific account in cache
      queryClient.setQueryData(
        chartOfAccountsQueryKeys.detail(updatedAccount.id),
        updatedAccount
      )
      
      toast.success('Account updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update account')
    },
  })
}

// Hook for deleting chart of account
export const useDeleteChartOfAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => chartOfAccountsApiService.deleteChartOfAccount(id),
    onSuccess: (_, deletedId) => {
      // Invalidate and refetch chart of accounts lists
      queryClient.invalidateQueries({ queryKey: chartOfAccountsQueryKeys.lists() })
      
      // Remove the account from cache
      queryClient.removeQueries({ queryKey: chartOfAccountsQueryKeys.detail(deletedId) })
      
      toast.success('Account deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete account')
    },
  })
}

// Hook for bulk creating accounts (useful for initial data setup)
export const useBulkCreateChartOfAccounts = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (accounts: (ChartOfAccountFormData & { companyId?: number })[]) =>
      chartOfAccountsApiService.bulkCreateChartOfAccounts(accounts),
    onSuccess: (newAccounts) => {
      // Invalidate and refetch chart of accounts lists
      queryClient.invalidateQueries({ queryKey: chartOfAccountsQueryKeys.lists() })
      
      toast.success(`${newAccounts.length} accounts created successfully`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create accounts')
    },
  })
}

// Hook for getting accounts by type
export const useAccountsByType = (type: string, companyId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...chartOfAccountsQueryKeys.all, 'by-type', type, companyId],
    queryFn: () => chartOfAccountsApiService.getAccountsByType(type, companyId),
    enabled: enabled && !!type,
    staleTime: 60_000, // 1 minute
  })
}

// Hook for searching accounts
export const useSearchAccounts = (searchTerm: string, companyId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...chartOfAccountsQueryKeys.all, 'search', searchTerm, companyId],
    queryFn: () => chartOfAccountsApiService.searchAccounts(searchTerm, companyId),
    enabled: enabled && !!searchTerm && searchTerm.length >= 2, // Only search with 2+ characters
    staleTime: 30_000, // 30 seconds
  })
}

// Hook for checking account code uniqueness
export const useAccountCodeUniqueness = () => {
  return useMutation({
    mutationFn: ({ code, excludeId }: { code: string; excludeId?: string }) =>
      chartOfAccountsApiService.isAccountCodeUnique(code, excludeId),
  })
}

// Hook for bulk deleting chart of accounts
export const useBulkDeleteChartOfAccounts = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (companyId?: number | 'null') => 
      chartOfAccountsApiService.bulkDeleteChartOfAccounts(companyId),
    onSuccess: (result) => {
      // Invalidate and refetch all chart of accounts queries
      queryClient.invalidateQueries({ queryKey: chartOfAccountsQueryKeys.all })
      
      toast.success(result.message)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to bulk delete accounts')
    },
  })
}

// Utility hook that provides common operations
export const useChartOfAccountsOperations = () => {
  const createAccount = useCreateChartOfAccount()
  const updateAccount = useUpdateChartOfAccount()
  const deleteAccount = useDeleteChartOfAccount()
  const bulkCreateAccounts = useBulkCreateChartOfAccounts()
  const bulkDeleteAccounts = useBulkDeleteChartOfAccounts()

  return {
    createAccount,
    updateAccount,
    deleteAccount,
    bulkCreateAccounts,
    bulkDeleteAccounts,
    // Convenience methods
    createAccountAsync: createAccount.mutateAsync,
    updateAccountAsync: updateAccount.mutateAsync,
    deleteAccountAsync: deleteAccount.mutateAsync,
    bulkCreateAccountsAsync: bulkCreateAccounts.mutateAsync,
    bulkDeleteAccountsAsync: bulkDeleteAccounts.mutateAsync,
    // Loading states
    isCreating: createAccount.isPending,
    isUpdating: updateAccount.isPending,
    isDeleting: deleteAccount.isPending,
    isBulkCreating: bulkCreateAccounts.isPending,
    isBulkDeleting: bulkDeleteAccounts.isPending,
    // Any operation loading
    isLoading: createAccount.isPending || updateAccount.isPending || 
               deleteAccount.isPending || bulkCreateAccounts.isPending ||
               bulkDeleteAccounts.isPending,
  }
}