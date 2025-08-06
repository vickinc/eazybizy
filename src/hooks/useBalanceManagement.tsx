import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AccountBalance, 
  BalanceFilterState, 
  BalanceSummary, 
  GroupedBalances,
  BalanceManagementState,
  FilterPeriod,
  AccountTypeFilter,
  BalanceViewFilter,
  BalanceGroupBy,
  InitialBalance
} from '@/types/balance.types';
import { BalanceBusinessService } from '@/services/business/balanceBusinessService';
import { balanceStorageService } from '@/services/storage/balanceStorageService';

const defaultFilters: BalanceFilterState = {
  selectedPeriod: 'thisMonth',
  customDateRange: {
    startDate: '',
    endDate: ''
  },
  accountTypeFilter: 'all',
  viewFilter: 'all',
  groupBy: 'account',
  searchTerm: '',
  showZeroBalances: true
};

export const useBalanceManagement = (selectedCompany: number | 'all') => {
  const [state, setState] = useState<BalanceManagementState>({
    balances: [],
    groupedBalances: {},
    summary: {
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      accountCount: 0,
      bankAccountCount: 0,
      walletCount: 0,
      currencyBreakdown: {}
    },
    loading: true,
    error: null,
    filters: { ...defaultFilters }
  });

  // Load and filter balances
  const loadBalances = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const currentFilters = state.filters;
      console.log('🔄 Loading balances with database-backed currency rates...');
      
      const balances = BalanceBusinessService.getAccountBalances(currentFilters, selectedCompany);
      const groupedBalances = BalanceBusinessService.groupBalances(balances, currentFilters.groupBy);
      const summary = await BalanceBusinessService.calculateBalanceSummary(balances);

      console.log(`✅ Calculated balance summary: $${summary.totalAssets.toFixed(2)} total assets`);

      setState(prev => ({
        ...prev,
        balances,
        groupedBalances,
        summary,
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('❌ Error loading balances:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load balances'
      }));
    }
  }, [selectedCompany, state.filters]);

  // Update filters and reload balances
  const updateFilters = useCallback(async (newFilters: Partial<BalanceFilterState>) => {
    setState(prev => ({ ...prev, loading: true, filters: { ...prev.filters, ...newFilters } }));
    
    try {
      const updatedFilters = { ...state.filters, ...newFilters };
      console.log('🔄 Updating filters and recalculating balances...');
      
      const balances = BalanceBusinessService.getAccountBalances(updatedFilters, selectedCompany);
      const groupedBalances = BalanceBusinessService.groupBalances(balances, updatedFilters.groupBy);
      const summary = await BalanceBusinessService.calculateBalanceSummary(balances);

      console.log(`✅ Updated balance summary: $${summary.totalAssets.toFixed(2)} total assets`);

      setState(prev => ({
        ...prev,
        filters: updatedFilters,
        balances,
        groupedBalances,
        summary,
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('❌ Error updating filters:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update filters'
      }));
    }
  }, [selectedCompany, state.filters]);

  // Set period filter
  const setPeriodFilter = useCallback((period: FilterPeriod) => {
    updateFilters({ selectedPeriod: period });
  }, [updateFilters]);

  // Set custom date range
  const setCustomDateRange = useCallback((startDate: string, endDate: string) => {
    updateFilters({
      selectedPeriod: 'custom',
      customDateRange: { startDate, endDate }
    });
  }, [updateFilters]);

  // Set account type filter
  const setAccountTypeFilter = useCallback((accountType: AccountTypeFilter) => {
    updateFilters({ accountTypeFilter: accountType });
  }, [updateFilters]);

  // Set view filter
  const setViewFilter = useCallback((viewFilter: BalanceViewFilter) => {
    updateFilters({ viewFilter });
  }, [updateFilters]);

  // Set group by
  const setGroupBy = useCallback((groupBy: BalanceGroupBy) => {
    updateFilters({ groupBy });
  }, [updateFilters]);

  // Set search term
  const setSearchTerm = useCallback((searchTerm: string) => {
    updateFilters({ searchTerm });
  }, [updateFilters]);

  // Toggle zero balances
  const toggleZeroBalances = useCallback(() => {
    updateFilters({ showZeroBalances: !state.filters.showZeroBalances });
  }, [updateFilters, state.filters.showZeroBalances]);

  // Save initial balance
  const saveInitialBalance = useCallback(async (
    accountId: string,
    accountType: 'bank' | 'wallet',
    amount: number,
    currency: string,
    companyId: number,
    notes?: string
  ): Promise<InitialBalance> => {
    try {
      const initialBalance = balanceStorageService.saveInitialBalance({
        accountId,
        accountType,
        amount,
        currency,
        companyId,
        notes
      });

      // Reload balances to reflect the change
      loadBalances();

      return initialBalance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save initial balance';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [loadBalances]);

  // Update initial balance
  const updateInitialBalance = useCallback(async (
    id: string,
    updates: Partial<Omit<InitialBalance, 'id' | 'createdAt'>>
  ): Promise<InitialBalance | null> => {
    try {
      const updatedBalance = balanceStorageService.updateInitialBalance(id, updates);
      
      if (updatedBalance) {
        // Reload balances to reflect the change
        loadBalances();
      }

      return updatedBalance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update initial balance';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [loadBalances]);

  // Delete initial balance
  const deleteInitialBalance = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = balanceStorageService.deleteInitialBalance(id);
      
      if (success) {
        // Reload balances to reflect the change
        loadBalances();
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete initial balance';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [loadBalances]);

  // Get initial balance for account
  const getInitialBalance = useCallback((accountId: string, accountType: 'bank' | 'wallet'): InitialBalance | null => {
    return balanceStorageService.getInitialBalance(accountId, accountType);
  }, []);

  // Export balance data
  const exportBalances = useCallback((format: 'csv' | 'json' = 'csv'): string => {
    return BalanceBusinessService.exportBalanceData(state.balances, format);
  }, [state.balances]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: { ...defaultFilters }
    }));
  }, []);

  // Validate balance data
  const validationResult = useMemo(() => {
    return BalanceBusinessService.validateBalanceData(state.balances);
  }, [state.balances]);

  // Load balances when company changes or on initial mount
  useEffect(() => {
    loadBalances();
  }, [selectedCompany]); // Remove loadBalances from dependencies to prevent infinite loop

  return {
    // State
    balances: state.balances,
    groupedBalances: state.groupedBalances,
    summary: state.summary,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    
    // Validation
    validation: validationResult,
    
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
    getInitialBalance,
    
    // Utility actions
    loadBalances,
    exportBalances,
    clearError,
    
    // Computed values
    hasBalances: state.balances.length > 0,
    filteredCount: state.balances.length,
    groupCount: Object.keys(state.groupedBalances).length
  };
};