import { useState, useCallback, useMemo } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { Company } from '@/types/company.types';
import { 
  BalanceApiService,
  BalanceQueryParams,
  InitialBalanceFormData,
  BalancesResponse
} from '@/services/api/balanceApiService';
import { BalanceListItem } from '@/services/database/balanceSSRService';
import { 
  FilterPeriod,
  AccountTypeFilter,
  BalanceViewFilter,
  BalanceGroupBy,
  BalanceFilterState,
  BalanceSummary,
  GroupedBalances
} from '@/types/balance.types';

// Create service instance
const balanceApiService = new BalanceApiService();

export interface BalanceManagementDBHook {
  // Data
  balances: BalanceListItem[];
  groupedBalances: GroupedBalances;
  summary: BalanceSummary;
  
  // UI State
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  filters: BalanceFilterState;
  
  // Validation
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  
  // Filter actions
  setPeriodFilter: (period: FilterPeriod) => void;
  setCustomDateRange: (startDate: string, endDate: string) => void;
  setAccountTypeFilter: (accountType: AccountTypeFilter) => void;
  setViewFilter: (viewFilter: BalanceViewFilter) => void;
  setGroupBy: (groupBy: BalanceGroupBy) => void;
  setSearchTerm: (searchTerm: string) => void;
  toggleZeroBalances: () => void;
  updateFilters: (newFilters: Partial<BalanceFilterState>) => void;
  resetFilters: () => void;
  
  // Initial balance actions
  saveInitialBalance: (
    accountId: string,
    accountType: 'bank' | 'wallet',
    amount: number,
    currency: string,
    companyId: number,
    notes?: string
  ) => Promise<void>;
  updateInitialBalance: (
    id: string,
    updates: Partial<Omit<InitialBalanceFormData, 'accountId' | 'accountType' | 'companyId'>>
  ) => Promise<void>;
  deleteInitialBalance: (id: string) => Promise<void>;
  
  // Utility actions
  loadBalances: () => void;
  exportBalances: (format: 'csv' | 'json') => string;
  clearError: () => void;
  
  // Computed values
  hasBalances: boolean;
  filteredCount: number;
  groupCount: number;
}

const defaultFilters: BalanceFilterState = {
  selectedPeriod: 'thisMonth', // Match SSR prefetch default
  customDateRange: {
    startDate: '',
    endDate: ''
  },
  asOfDate: new Date().toISOString().split('T')[0], // Default to today
  accountTypeFilter: 'all',
  viewFilter: 'all',
  groupBy: 'account',
  searchTerm: '',
  showZeroBalances: true
};

export function useBalanceManagementDB(
  selectedCompany: number | 'all',
  companies: Company[]
): BalanceManagementDBHook {
  const queryClient = useQueryClient();
  
  // Filter State
  const [filters, setFilters] = useState<BalanceFilterState>(defaultFilters);
  
  // Query parameters for API calls
  const queryParams = useMemo((): BalanceQueryParams => {
    const params: BalanceQueryParams = {
      company: selectedCompany,
      accountType: filters.accountTypeFilter === 'all' ? undefined : filters.accountTypeFilter,
      search: filters.searchTerm || undefined,
      showZeroBalances: filters.showZeroBalances,
      viewFilter: filters.viewFilter === 'all' ? undefined : filters.viewFilter,
      groupBy: filters.groupBy,
      selectedPeriod: filters.selectedPeriod,
      startDate: filters.customDateRange.startDate || undefined,
      endDate: filters.customDateRange.endDate || undefined,
      asOfDate: filters.asOfDate || undefined,
      includeBlockchainBalances: true // Enable blockchain balance fetching
    };
    return params;
  }, [selectedCompany, filters]);

  // Fetch balances with React Query - optimized settings
  const {
    data: balancesResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['balances', queryParams],
    queryFn: () => {
      console.log('🔍 Client: React Query making API call with params:', {
        includeBlockchainBalances: queryParams.includeBlockchainBalances,
        company: queryParams.company,
        accountType: queryParams.accountType,
        showZeroBalances: queryParams.showZeroBalances
      });
      return balanceApiService.getBalances(queryParams);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - longer stale time to respect SSR data
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Critical: Don't refetch on mount - use SSR data first
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: 1, // Reduce retry attempts for faster feedback
    refetchInterval: false, // Disable automatic refetching
    networkMode: 'online', // Only fetch when online
    enabled: true, // Enable client-side fetching for filter changes
  });

  // Extract data from response
  const balances = useMemo(() => {
    const data = balancesResponse?.data || [];
    
    // Debug: Log Tron balances to see what client receives
    const tronBalances = data.filter(b => 
      b.account?.blockchain === 'tron' || 
      b.currency === 'TRX' || 
      (b.currency === 'USDT' && b.account?.walletAddress === 'TAFwhJwa9oHGPV1Li6FRBWETsynqMkQ8vF') ||
      (b.currency === 'USDC' && b.account?.walletAddress === 'TAFwhJwa9oHGPV1Li6FRBWETsynqMkQ8vF')
    );
    
    if (tronBalances.length > 0) {
      console.log('🖥️ Client: Tron balances received:', tronBalances.map(b => ({
        currency: b.currency,
        finalBalance: b.finalBalance,
        walletAddress: b.account?.walletAddress,
        walletName: b.account?.walletName
      })));
      
      // Debug: Check if we're getting zero values that should be non-zero
      const zeroTronBalances = tronBalances.filter(b => b.finalBalance === 0 && (b.currency === 'TRX' || b.currency === 'USDT'));
      if (zeroTronBalances.length > 0) {
        console.error('❌ Client: Found zero Tron balances that should be enriched:', zeroTronBalances.map(b => ({
          currency: b.currency,
          finalBalance: b.finalBalance,
          initialBalance: b.initialBalance,
          transactionBalance: b.transactionBalance,
          accountId: b.account?.id,
          blockchainBalance: (b as any).blockchainBalance,
          blockchainSyncStatus: (b as any).blockchainSyncStatus
        })));
      }
    }
    
    return data;
  }, [balancesResponse]);
  const summary = useMemo(() => balancesResponse?.summary || {
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    accountCount: 0,
    bankAccountCount: 0,
    walletCount: 0,
    currencyBreakdown: {}
  }, [balancesResponse]);

  // Group balances based on groupBy filter
  const groupedBalances = useMemo((): GroupedBalances => {
    if (filters.groupBy === 'none') {
      return { 'All Accounts': balances };
    }

    const grouped: GroupedBalances = {};

    balances.forEach(balance => {
      let groupKey: string;

      switch (filters.groupBy) {
        case 'account':
          // Assuming we can determine account type from the account object
          const isBank = 'bankName' in balance.account || 'iban' in balance.account;
          groupKey = isBank ? 'Bank Accounts' : 'Digital Wallets';
          break;
        case 'currency':
          groupKey = balance.currency;
          break;
        case 'type':
          const isBankType = 'bankName' in balance.account || 'iban' in balance.account;
          groupKey = isBankType ? `Banks (${balance.currency})` : `Wallets (${balance.currency})`;
          break;
        default:
          groupKey = 'Other';
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(balance);
    });

    // Sort groups alphabetically
    const sortedGrouped: GroupedBalances = {};
    Object.keys(grouped).sort().forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

    return sortedGrouped;
  }, [balances, filters.groupBy]);

  // Create Initial Balance Mutation
  const createInitialBalanceMutation = useMutation({
    mutationFn: (data: InitialBalanceFormData) => balanceApiService.createInitialBalance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      toast.success('Initial balance saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save initial balance: ${error.message}`);
    },
  });

  // Update Initial Balance Mutation
  const updateInitialBalanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InitialBalanceFormData> }) => 
      balanceApiService.updateInitialBalance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      toast.success('Initial balance updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update initial balance: ${error.message}`);
    },
  });

  // Delete Initial Balance Mutation
  const deleteInitialBalanceMutation = useMutation({
    mutationFn: (id: string) => balanceApiService.deleteInitialBalance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      toast.success('Initial balance deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete initial balance: ${error.message}`);
    },
  });

  // Filter actions
  const setPeriodFilter = useCallback((period: FilterPeriod) => {
    setFilters(prev => ({ ...prev, selectedPeriod: period }));
  }, []);

  const setCustomDateRange = useCallback((startDate: string, endDate: string) => {
    setFilters(prev => ({
      ...prev,
      selectedPeriod: 'custom',
      customDateRange: { startDate, endDate }
    }));
  }, []);

  const setAccountTypeFilter = useCallback((accountType: AccountTypeFilter) => {
    setFilters(prev => ({ ...prev, accountTypeFilter: accountType }));
  }, []);

  const setViewFilter = useCallback((viewFilter: BalanceViewFilter) => {
    setFilters(prev => ({ ...prev, viewFilter }));
  }, []);

  const setGroupBy = useCallback((groupBy: BalanceGroupBy) => {
    setFilters(prev => ({ ...prev, groupBy }));
  }, []);

  const setSearchTerm = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, []);

  const toggleZeroBalances = useCallback(() => {
    setFilters(prev => ({ ...prev, showZeroBalances: !prev.showZeroBalances }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<BalanceFilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Initial balance actions
  const saveInitialBalance = useCallback(async (
    accountId: string,
    accountType: 'bank' | 'wallet',
    amount: number,
    currency: string,
    companyId: number,
    notes?: string
  ) => {
    const data: InitialBalanceFormData = {
      accountId,
      accountType,
      amount,
      currency,
      companyId,
      notes
    };
    
    await createInitialBalanceMutation.mutateAsync(data);
  }, [createInitialBalanceMutation]);

  const updateInitialBalance = useCallback(async (
    id: string,
    updates: Partial<Omit<InitialBalanceFormData, 'accountId' | 'accountType' | 'companyId'>>
  ) => {
    await updateInitialBalanceMutation.mutateAsync({ id, data: updates });
  }, [updateInitialBalanceMutation]);

  const deleteInitialBalance = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this initial balance?')) {
      await deleteInitialBalanceMutation.mutateAsync(id);
    }
  }, [deleteInitialBalanceMutation]);

  // Utility actions
  const loadBalances = useCallback(() => {
    refetch();
  }, [refetch]);

  const exportBalances = useCallback((format: 'csv' | 'json' = 'csv'): string => {
    if (format === 'json') {
      return JSON.stringify(balances, null, 2);
    }

    // CSV format
    const headers = [
      'Account Name',
      'Company',
      'Account Type',
      'Currency',
      'Initial Balance',
      'Transaction Balance',
      'Final Balance',
      'Last Transaction Date'
    ];

    const rows = balances.map(balance => [
      balance.account.name,
      balance.company.tradingName,
      'bankName' in balance.account ? 'Bank' : 'Wallet',
      balance.currency,
      balance.initialBalance.toString(),
      balance.transactionBalance.toString(),
      balance.finalBalance.toString(),
      balance.lastTransactionDate || 'Never'
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }, [balances]);

  const clearError = useCallback(() => {
    // Error clearing is handled automatically by React Query
  }, []);

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    balances.forEach((balance, index) => {
      // Check for missing company
      if (!balance.company) {
        errors.push(`Balance ${index + 1}: Missing company information`);
      }

      // Check for invalid amounts
      if (isNaN(balance.finalBalance) || !isFinite(balance.finalBalance)) {
        errors.push(`Balance ${index + 1}: Invalid final balance amount`);
      }

      // Check for missing currency
      if (!balance.currency) {
        errors.push(`Balance ${index + 1}: Missing currency information`);
      }

      // Warning for very old last transaction
      if (balance.lastTransactionDate) {
        const lastDate = new Date(balance.lastTransactionDate);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        if (lastDate < sixMonthsAgo) {
          warnings.push(`Account ${balance.account.name}: Last transaction over 6 months ago`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }, [balances]);

  return {
    // Data
    balances,
    groupedBalances,
    summary,
    
    // UI State
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    filters,
    
    // Validation
    validation,
    
    // Filter actions
    setPeriodFilter,
    setCustomDateRange,
    setAccountTypeFilter,
    setViewFilter,
    setGroupBy,
    setSearchTerm,
    toggleZeroBalances,
    updateFilters,
    resetFilters,
    
    // Initial balance actions
    saveInitialBalance,
    updateInitialBalance,
    deleteInitialBalance,
    
    // Utility actions
    loadBalances,
    exportBalances,
    clearError,
    
    // Computed values
    hasBalances: balances.length > 0,
    filteredCount: balances.length,
    groupCount: Object.keys(groupedBalances).length
  };
}