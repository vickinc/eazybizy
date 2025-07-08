import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ChartOfAccountsStorageService } from '@/services/storage';

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
  // Core Data State
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<ChartOfAccountFormData>(initialFormData);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  
  // Filter State
  const [filter, setFilter] = useState<ChartOfAccountsFilter>(initialFilter);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedAccounts = ChartOfAccountsStorageService.getAccounts();
      console.log('Loading Chart of Accounts:', { savedAccountsCount: savedAccounts.length });
      
      // If no accounts exist, initialize with default data
      if (savedAccounts.length === 0) {
        console.log('No saved accounts found, initializing default accounts...');
        const defaultAccounts = ChartOfAccountsBusinessService.initializeDefaultAccounts();
        console.log('Default accounts initialized:', { count: defaultAccounts.length });
        setAccounts(defaultAccounts);
      } else {
        console.log('Using saved accounts:', { count: savedAccounts.length });
        setAccounts(savedAccounts);
      }
      
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading chart of accounts:', error);
      setIsLoaded(true);
    }
  }, []);

  // Save accounts to localStorage when changed
  useEffect(() => {
    if (isLoaded && accounts.length > 0) {
      ChartOfAccountsStorageService.saveAccounts(accounts);
    }
  }, [accounts, isLoaded]);

  // Filtered accounts calculation
  const filteredAccounts = useMemo(() => {
    // First enrich accounts with calculated fields including categories
    const enriched = ChartOfAccountsBusinessService.enrichAccountsWithCalculatedFields(accounts);
    // Then filter the enriched accounts
    const filtered = ChartOfAccountsBusinessService.filterAccounts(enriched, filter);
    // Finally sort using the new signature
    return ChartOfAccountsBusinessService.sortAccounts(filtered, { field: 'code', direction: 'asc' });
  }, [accounts, filter]);

  // Stats calculation
  const stats = useMemo(() => {
    const enriched = ChartOfAccountsBusinessService.enrichAccountsWithCalculatedFields(accounts);
    return ChartOfAccountsBusinessService.calculateStats(enriched);
  }, [accounts]);

  // Form Handlers
  const handleFormInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = ChartOfAccountsValidationService.validateAccountForm(
      formData, 
      editingAccount?.id
    );
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    if (editingAccount) {
      // Update existing account
      const updatedAccount = ChartOfAccountsBusinessService.updateAccountFromFormData(
        editingAccount, 
        formData
      );
      
      setAccounts(prev => prev.map(account => 
        account.id === editingAccount.id ? updatedAccount : account
      ));
      
      toast.success('Account updated successfully');
    } else {
      // Add new account
      const newAccount = ChartOfAccountsBusinessService.createAccountFromFormData(formData);
      setAccounts(prev => [newAccount, ...prev]);
      toast.success('Account added successfully');
    }

    resetForm();
    setShowAccountDialog(false);
  }, [formData, editingAccount]);

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

  const handleDeleteAccount = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      const validation = ChartOfAccountsValidationService.validateAccountDeletion(id);
      
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        return;
      }

      setAccounts(prev => prev.filter(account => account.id !== id));
      toast.success('Account deleted successfully');
    }
  }, []);

  const handleDeactivateAccount = useCallback((id: string) => {
    if (confirm('Are you sure you want to deactivate this account?')) {
      setAccounts(prev => prev.map(account => 
        account.id === id 
          ? { ...account, isActive: false, updatedAt: new Date().toISOString() }
          : account
      ));
      toast.success('Account deactivated successfully');
    }
  }, []);

  const handleReactivateAccount = useCallback((id: string) => {
    setAccounts(prev => prev.map(account => 
      account.id === id 
        ? { ...account, isActive: true, updatedAt: new Date().toISOString() }
        : account
    ));
    toast.success('Account reactivated successfully');
  }, []);

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

  const initializeDefaultData = useCallback(() => {
    const defaultAccounts = ChartOfAccountsBusinessService.initializeDefaultAccounts();
    setAccounts(defaultAccounts);
    toast.success('Default chart of accounts loaded successfully');
  }, []);

  const forceRefreshCompleteDataset = useCallback(() => {
    // Clear existing data first
    ChartOfAccountsStorageService.clearAllAccounts();
    
    // Force reload with complete dataset
    const completeAccounts = ChartOfAccountsBusinessService.initializeDefaultAccounts();
    setAccounts(completeAccounts);
    toast.success(`Complete chart of accounts loaded successfully (${completeAccounts.length} accounts)`);
  }, []);

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
    forceRefreshCompleteDataset
  };
};