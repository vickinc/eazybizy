import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  ChartOfAccount,
  ChartOfAccountFormData,
  ChartOfAccountsStats,
  ChartOfAccountsFilter,
  AccountType,
  VATType
} from '@/types/chartOfAccounts.types';
import { ChartOfAccountsBusinessService } from '@/services/business/chartOfAccountsBusinessService';
import { ChartOfAccountsValidationService } from '@/services/business/chartOfAccountsValidationService';
import { 
  useChartOfAccounts, 
  useChartOfAccountsOperations,
  useBulkCreateChartOfAccounts
} from '@/hooks/useChartOfAccountsAPI';

export interface ChartOfAccountsManagementHook {
  // Data
  accounts: ChartOfAccount[];
  filteredAccounts: ChartOfAccount[];
  stats: ChartOfAccountsStats;
  
  // State
  isLoaded: boolean;
  
  // Form State
  formData: ChartOfAccountFormData;
  editingAccount: ChartOfAccount | null;
  showAccountDialog: boolean;
  
  // Filter State
  filter: ChartOfAccountsFilter;
  
  // Actions
  handleFormInputChange: (field: string, value: string) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  handleEditAccount: (account: ChartOfAccount) => void;
  handleDeleteAccount: (id: string) => void;
  handleDeactivateAccount: (id: string) => void;
  handleReactivateAccount: (id: string) => void;
  resetForm: () => void;
  setShowAccountDialog: (show: boolean) => void;
  
  // Filter Actions
  handleFilterChange: (field: string, value: string | boolean) => void;
  clearFilters: () => void;
  
  // Utility Functions
  getAccountsByType: (type: AccountType) => ChartOfAccount[];
  searchAccounts: (searchTerm: string) => ChartOfAccount[];
  exportToCSV: () => string;
  initializeDefaultData: () => void;
  forceRefreshCompleteDataset: () => void;
  clearAllData: () => void;
}

const initialFormData: ChartOfAccountFormData = {
  code: '',
  name: '',
  type: 'Expense',
  category: 'Other operating expenses',
  vat: 'Value Added Tax 22%',
  relatedVendor: '',
  accountType: 'Detail'
};

const initialFilter: ChartOfAccountsFilter = {
  search: '',
  type: 'all',
  category: 'all',
  vat: 'all',
  accountType: 'all',
  isActive: 'all'
};

export const useChartOfAccountsManagement = (): ChartOfAccountsManagementHook => {
  // Form State
  const [formData, setFormData] = useState<ChartOfAccountFormData>(initialFormData);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  
  // Filter State
  const [filter, setFilter] = useState<ChartOfAccountsFilter>(initialFilter);
  
  // API Query parameters based on filter
  const queryParams = useMemo(() => ({
    search: filter.search,
    type: filter.type,
    category: filter.category,
    isActive: filter.isActive,
    accountType: filter.accountType,
    take: 1000, // Get all accounts for now (can be paginated later)
  }), [filter]);
  
  // API Hooks
  const { data: accountsResponse, isLoading, error } = useChartOfAccounts(queryParams);
  const { createAccount, updateAccount, deleteAccount, bulkDeleteAccounts } = useChartOfAccountsOperations();
  const bulkCreate = useBulkCreateChartOfAccounts();
  
  // Derived state
  const accounts = accountsResponse?.data || [];
  const isLoaded = !isLoading;

  // Filtered accounts are now handled by the API query, but we still enrich them
  const filteredAccounts = useMemo(() => {
    // Enrich accounts with calculated fields
    const enriched = ChartOfAccountsBusinessService.enrichAccountsWithCalculatedFields(accounts);
    // Sort the enriched accounts
    return ChartOfAccountsBusinessService.sortAccounts(enriched, { field: 'code', direction: 'asc' });
  }, [accounts]);

  // Stats calculation from API response or calculated locally
  const stats = useMemo(() => {
    if (accountsResponse?.statistics) {
      // Use API statistics if available
      return {
        totalAccounts: accountsResponse.statistics.total,
        activeAccounts: accountsResponse.statistics.activeStats?.active || 0,
        inactiveAccounts: accountsResponse.statistics.activeStats?.inactive || 0,
        totalBalance: accountsResponse.statistics.totalBalance,
        averageBalance: accountsResponse.statistics.averageBalance,
        accountsByType: accountsResponse.statistics.typeStats || {},
        accountsByCategory: {} // Not provided by API yet
      };
    } else {
      // Fallback to local calculation
      const enriched = ChartOfAccountsBusinessService.enrichAccountsWithCalculatedFields(accounts);
      return ChartOfAccountsBusinessService.calculateStats(enriched);
    }
  }, [accounts, accountsResponse?.statistics]);

  // Form Handlers
  const handleFormInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = ChartOfAccountsValidationService.validateAccountForm(
      formData, 
      editingAccount?.id
    );
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    try {
      if (editingAccount) {
        // Update existing account via API
        await updateAccount.mutateAsync({
          id: editingAccount.id,
          data: formData
        });
      } else {
        // Create new account via API
        await createAccount.mutateAsync(formData);
      }

      resetForm();
      setShowAccountDialog(false);
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Form submission error:', error);
    }
  }, [formData, editingAccount, updateAccount, createAccount]);

  const handleEditAccount = useCallback((account: ChartOfAccount) => {
    setEditingAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      type: account.type,
      category: account.category,
      vat: account.vat,
      relatedVendor: account.relatedVendor || '',
      accountType: account.accountType
    });
    setShowAccountDialog(true);
  }, []);

  const handleDeleteAccount = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      const validation = ChartOfAccountsValidationService.validateAccountDeletion(id);
      
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        return;
      }

      try {
        await deleteAccount.mutateAsync(id);
      } catch (error) {
        console.error('Delete account error:', error);
      }
    }
  }, [deleteAccount]);

  const handleDeactivateAccount = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to deactivate this account?')) {
      try {
        await updateAccount.mutateAsync({
          id,
          data: { isActive: false }
        });
      } catch (error) {
        console.error('Deactivate account error:', error);
      }
    }
  }, [updateAccount]);

  const handleReactivateAccount = useCallback(async (id: string) => {
    try {
      await updateAccount.mutateAsync({
        id,
        data: { isActive: true }
      });
    } catch (error) {
      console.error('Reactivate account error:', error);
    }
  }, [updateAccount]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setEditingAccount(null);
  }, []);

  // Filter Handlers
  const handleFilterChange = useCallback((field: string, value: string | boolean) => {
    setFilter(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilter(initialFilter);
  }, []);

  // Utility Functions
  const getAccountsByType = useCallback((type: AccountType) => {
    return ChartOfAccountsBusinessService.getAccountsByType(accounts, type);
  }, [accounts]);

  const searchAccounts = useCallback((searchTerm: string) => {
    return ChartOfAccountsBusinessService.searchAccounts(accounts, searchTerm);
  }, [accounts]);

  const exportToCSV = useCallback(() => {
    return ChartOfAccountsBusinessService.exportToCSV(filteredAccounts);
  }, [filteredAccounts]);

  const initializeDefaultData = useCallback(async () => {
    try {
      // Get clean default accounts (no localStorage involved)
      const defaultAccounts = ChartOfAccountsBusinessService.initializeDefaultAccounts();
      const accountsToCreate = defaultAccounts.map(account => ({
        code: account.code,
        name: account.name,
        type: account.type,
        category: account.category,
        subcategory: account.subcategory,
        vat: account.vat,
        relatedVendor: account.relatedVendor || '',
        accountType: account.accountType,
        ifrsReference: account.ifrsReference,
      }));
      
      await bulkCreate.mutateAsync(accountsToCreate);
      toast.success(`Successfully created ${accountsToCreate.length} default chart of accounts`);
    } catch (error) {
      console.error('Initialize default data error:', error);
      toast.error('Failed to create default chart of accounts');
    }
  }, [bulkCreate]);

  const forceRefreshCompleteDataset = useCallback(async () => {
    try {
      // Get complete default dataset (no localStorage involved)
      const completeAccounts = ChartOfAccountsBusinessService.getCompleteDefaultDataset();
      const accountsToCreate = completeAccounts.map(account => ({
        code: account.code,
        name: account.name,
        type: account.type,
        category: account.category,
        subcategory: account.subcategory,
        vat: account.vat,
        relatedVendor: account.relatedVendor || '',
        accountType: account.accountType,
        ifrsReference: account.ifrsReference,
      }));
      
      await bulkCreate.mutateAsync(accountsToCreate);
      toast.success(`Force refreshed ${accountsToCreate.length} chart of accounts`);
    } catch (error) {
      console.error('Force refresh complete dataset error:', error);
      toast.error('Failed to force refresh chart of accounts');
    }
  }, [bulkCreate]);

  const clearAllData = useCallback(async () => {
    if (confirm('Are you sure you want to clear all chart of accounts data? This action cannot be undone.')) {
      try {
        // Delete accounts with null companyId (the 218 accounts showing)
        await bulkDeleteAccounts.mutateAsync('null');
        toast.success('Successfully cleared all chart of accounts data');
      } catch (error) {
        console.error('Clear all data error:', error);
        toast.error('Failed to clear chart of accounts data');
      }
    }
  }, [bulkDeleteAccounts]);

  return {
    // Data
    accounts,
    filteredAccounts,
    stats,
    
    // State
    isLoaded,
    
    // Form State
    formData,
    editingAccount,
    showAccountDialog,
    
    // Filter State
    filter,
    
    // Actions
    handleFormInputChange,
    handleFormSubmit,
    handleEditAccount,
    handleDeleteAccount,
    handleDeactivateAccount,
    handleReactivateAccount,
    resetForm,
    setShowAccountDialog,
    
    // Filter Actions
    handleFilterChange,
    clearFilters,
    
    // Utility Functions
    getAccountsByType,
    searchAccounts,
    exportToCSV,
    initializeDefaultData,
    forceRefreshCompleteDataset,
    clearAllData
  };
};