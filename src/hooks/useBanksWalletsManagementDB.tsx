import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Company } from '@/types';

// API Service interfaces
interface BankAccountFormData {
  companyId: number;
  bankName: string;
  bankAddress: string;
  currency: string;
  iban: string;
  swiftCode: string;
  accountNumber?: string;
  accountName: string;
  notes?: string;
}

interface DigitalWalletFormData {
  companyId: number;
  walletType: 'paypal' | 'stripe' | 'wise' | 'crypto' | 'other';
  walletName: string;
  walletAddress: string;
  currency: string;
  currencies?: string;
  description: string;
  blockchain?: string;
  notes?: string;
}

interface BankAccount {
  id: string;
  companyId: number;
  bankName: string;
  bankAddress: string;
  currency: string;
  iban: string;
  swiftCode: string;
  accountNumber?: string;
  accountName: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface DigitalWallet {
  id: string;
  companyId: number;
  walletType: string;
  walletName: string;
  walletAddress: string;
  currency: string;
  currencies: string;
  description: string;
  blockchain?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API service functions
const bankAccountsApi = {
  async getAll(companyId: number | 'all') {
    const response = await fetch(`/api/bank-accounts?companyId=${companyId}`);
    if (!response.ok) throw new Error('Failed to fetch bank accounts');
    return response.json();
  },
  
  async create(data: BankAccountFormData) {
    const response = await fetch('/api/bank-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create bank account');
    return response.json();
  },
  
  async update(id: string, data: Partial<BankAccountFormData>) {
    const response = await fetch(`/api/bank-accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update bank account');
    return response.json();
  },
  
  async delete(id: string) {
    const response = await fetch(`/api/bank-accounts/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete bank account');
    return response.json();
  }
};

const digitalWalletsApi = {
  async getAll(companyId: number | 'all') {
    const response = await fetch(`/api/digital-wallets?companyId=${companyId}`);
    if (!response.ok) throw new Error('Failed to fetch digital wallets');
    return response.json();
  },
  
  async create(data: DigitalWalletFormData) {
    const response = await fetch('/api/digital-wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create digital wallet');
    }
    return response.json();
  },
  
  async update(id: string, data: Partial<DigitalWalletFormData>) {
    const response = await fetch(`/api/digital-wallets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update digital wallet');
    return response.json();
  },
  
  async delete(id: string) {
    const response = await fetch(`/api/digital-wallets/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete digital wallet');
    return response.json();
  }
};

// Initial form states
const initialBankAccount: BankAccountFormData = {
  companyId: 0,
  bankName: '',
  bankAddress: '',
  currency: 'USD',
  iban: '',
  swiftCode: '',
  accountNumber: '',
  accountName: '',
  notes: ''
};

const initialDigitalWallet: DigitalWalletFormData = {
  companyId: 0,
  walletType: 'crypto',
  walletName: '',
  walletAddress: '',
  currency: '',
  currencies: '',
  description: '',
  blockchain: '',
  notes: ''
};

export interface BanksWalletsManagementDBHook {
  // Data
  bankAccounts: BankAccount[];
  digitalWallets: DigitalWallet[];
  filteredBankAccounts: BankAccount[];
  filteredDigitalWallets: DigitalWallet[];
  
  // UI State
  isLoading: boolean;
  searchTerm: string;
  activeTab: 'banks' | 'wallets';
  expandedBanks: Set<string>;
  expandedWallets: Set<string>;
  isAllBanksExpanded: boolean;
  isAllWalletsExpanded: boolean;
  
  // Filter State
  viewFilter: 'all' | 'banks' | 'wallets';
  currencyFilter: string;
  typeFilter: string;
  
  // Filter Data
  availableCurrencies: string[];
  availableBankTypes: string[];
  availableWalletTypes: string[];
  
  // Dialog State
  showAddBankForm: boolean;
  showAddWalletForm: boolean;
  editingBank: BankAccount | null;
  editingWallet: DigitalWallet | null;
  newBankAccount: BankAccountFormData;
  newDigitalWallet: DigitalWalletFormData;
  
  // Actions
  setSearchTerm: (term: string) => void;
  setActiveTab: (tab: 'banks' | 'wallets') => void;
  setShowAddBankForm: (show: boolean) => void;
  setShowAddWalletForm: (show: boolean) => void;
  setEditingBank: (bank: BankAccount | null) => void;
  setEditingWallet: (wallet: DigitalWallet | null) => void;
  
  // Filter Actions
  setViewFilter: (filter: 'all' | 'banks' | 'wallets') => void;
  setCurrencyFilter: (currency: string) => void;
  setTypeFilter: (type: string) => void;
  
  // Form handlers
  updateNewBankAccount: (field: keyof BankAccountFormData, value: string | number) => void;
  updateNewDigitalWallet: (field: keyof DigitalWalletFormData, value: string | number) => void;
  
  // CRUD operations
  handleCreateBankAccount: () => Promise<void>;
  handleUpdateBankAccount: (bankData: BankAccount) => Promise<void>;
  handleDeleteBankAccount: (id: string) => Promise<void>;
  handleCreateDigitalWallet: () => Promise<void>;
  handleUpdateDigitalWallet: (walletData: DigitalWallet) => Promise<void>;
  handleDeleteDigitalWallet: (id: string) => Promise<void>;
  
  // Utility
  toggleBankExpansion: (id: string) => void;
  toggleWalletExpansion: (id: string) => void;
  toggleAllBanksExpansion: () => void;
  toggleAllWalletsExpansion: () => void;
  resetForms: () => void;
}

export const useBanksWalletsManagementDB = (
  selectedCompany: number | 'all',
  companies: Company[]
): BanksWalletsManagementDBHook => {
  const queryClient = useQueryClient();
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'banks' | 'wallets'>('banks');
  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());
  const [isAllBanksExpanded, setIsAllBanksExpanded] = useState(false);
  const [isAllWalletsExpanded, setIsAllWalletsExpanded] = useState(false);
  
  // Filter State
  const [viewFilter, setViewFilter] = useState<'all' | 'banks' | 'wallets'>('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Reset type filter when switching to banks view (since banks don't have types)
  const handleSetViewFilter = useCallback((filter: 'all' | 'banks' | 'wallets') => {
    setViewFilter(filter);
    if (filter === 'banks') {
      setTypeFilter('all'); // Reset type filter for banks
    }
  }, []);
  
  // Dialog State
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [showAddWalletForm, setShowAddWalletForm] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [editingWallet, setEditingWallet] = useState<DigitalWallet | null>(null);
  
  // Form State
  const [newBankAccount, setNewBankAccount] = useState<BankAccountFormData>(initialBankAccount);
  const [newDigitalWallet, setNewDigitalWallet] = useState<DigitalWalletFormData>(initialDigitalWallet);
  
  // Data queries
  const { data: bankAccountsResponse, isLoading: loadingBanks } = useQuery({
    queryKey: ['bank-accounts', selectedCompany],
    queryFn: () => bankAccountsApi.getAll(selectedCompany),
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: digitalWalletsResponse, isLoading: loadingWallets } = useQuery({
    queryKey: ['digital-wallets', selectedCompany],
    queryFn: () => digitalWalletsApi.getAll(selectedCompany),
    staleTime: 5 * 60 * 1000,
  });
  
  const isLoading = loadingBanks || loadingWallets;
  
  // Extract data
  const bankAccounts = useMemo(() => bankAccountsResponse?.data || [], [bankAccountsResponse]);
  const digitalWallets = useMemo(() => digitalWalletsResponse?.data || [], [digitalWalletsResponse]);
  
  // Available filter options
  const availableCurrencies = useMemo(() => {
    const bankCurrencies = bankAccounts.map(bank => bank.currency);
    const walletCurrencies = digitalWallets.map(wallet => wallet.currency);
    return [...new Set([...bankCurrencies, ...walletCurrencies])].sort();
  }, [bankAccounts, digitalWallets]);

  const availableBankTypes = useMemo(() => {
    // For banks, we can use common bank types or extract from data
    return ['Checking', 'Savings', 'Business', 'Investment', 'Credit Line'];
  }, []);

  const availableWalletTypes = useMemo(() => {
    const walletTypes = digitalWallets.map(wallet => wallet.walletType);
    return [...new Set(walletTypes)].sort();
  }, [digitalWallets]);

  // Filtered data with all filters applied
  const filteredBankAccounts = useMemo(() => {
    let filtered = bankAccounts;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(bank => 
        bank.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bank.company && bank.company.tradingName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply currency filter
    if (currencyFilter !== 'all') {
      filtered = filtered.filter(bank => bank.currency === currencyFilter);
    }
    
    // Apply type filter (for banks, we might need to add a type field or use a default logic)
    if (typeFilter !== 'all') {
      // For now, we'll skip type filtering for banks since they don't have explicit types
      // This could be enhanced later by adding a type field to the bank schema
    }
    
    return filtered;
  }, [bankAccounts, searchTerm, currencyFilter, typeFilter]);
  
  const filteredDigitalWallets = useMemo(() => {
    let filtered = digitalWallets;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(wallet =>
        wallet.walletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallet.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallet.walletType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wallet.walletAddress && wallet.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (wallet.company && wallet.company.tradingName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply currency filter
    if (currencyFilter !== 'all') {
      filtered = filtered.filter(wallet => wallet.currency === currencyFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(wallet => wallet.walletType === typeFilter);
    }
    
    return filtered;
  }, [digitalWallets, searchTerm, currencyFilter, typeFilter]);
  
  // Mutations
  const createBankMutation = useMutation({
    mutationFn: bankAccountsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      resetForms();
      setShowAddBankForm(false);
      toast.success('Bank account created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create bank account: ${error.message}`);
    }
  });
  
  const updateBankMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BankAccountFormData> }) =>
      bankAccountsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      resetForms();
      setEditingBank(null);
      toast.success('Bank account updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update bank account: ${error.message}`);
    }
  });
  
  const deleteBankMutation = useMutation({
    mutationFn: bankAccountsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Bank account deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete bank account: ${error.message}`);
    }
  });
  
  const createWalletMutation = useMutation({
    mutationFn: digitalWalletsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      resetForms();
      setShowAddWalletForm(false);
      toast.success('Digital wallet created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create digital wallet: ${error.message}`);
    }
  });
  
  const updateWalletMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DigitalWalletFormData> }) =>
      digitalWalletsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      resetForms();
      setEditingWallet(null);
      toast.success('Digital wallet updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update digital wallet: ${error.message}`);
    }
  });
  
  const deleteWalletMutation = useMutation({
    mutationFn: digitalWalletsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Digital wallet deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete digital wallet: ${error.message}`);
    }
  });
  
  // Form handlers
  const updateNewBankAccount = useCallback((field: keyof BankAccountFormData, value: string | number) => {
    setNewBankAccount(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const updateNewDigitalWallet = useCallback((field: keyof DigitalWalletFormData, value: string | number) => {
    setNewDigitalWallet(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const resetForms = useCallback(() => {
    setNewBankAccount(initialBankAccount);
    setNewDigitalWallet({
      ...initialDigitalWallet,
      walletType: 'crypto', // Ensure crypto is default even on reset
      currency: '' // User must select currency
    });
  }, []);
  
  // CRUD operations
  const handleCreateBankAccount = useCallback(async () => {
    if (selectedCompany === 'all') {
      toast.error('Please select a specific company');
      return;
    }
    
    const data = { ...newBankAccount, companyId: selectedCompany };
    await createBankMutation.mutateAsync(data);
  }, [newBankAccount, selectedCompany, createBankMutation]);
  
  const handleUpdateBankAccount = useCallback(async (bankData: BankAccount) => {
    if (!bankData) return;
    
    // Prepare the update data, excluding read-only fields
    const { id, createdAt, updatedAt, company, ...updateData } = bankData;
    
    await updateBankMutation.mutateAsync({ id: bankData.id, data: updateData });
  }, [updateBankMutation]);
  
  const handleDeleteBankAccount = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this bank account?')) {
      await deleteBankMutation.mutateAsync(id);
    }
  }, [deleteBankMutation]);
  
  const handleCreateDigitalWallet = useCallback(async () => {
    if (selectedCompany === 'all') {
      toast.error('Please select a specific company');
      return;
    }
    
    // Validate required fields
    if (!newDigitalWallet.walletName.trim()) {
      toast.error('Wallet name is required');
      return;
    }
    
    if (!newDigitalWallet.walletAddress.trim()) {
      toast.error('Wallet address is required');
      return;
    }
    
    const data = { ...newDigitalWallet, companyId: selectedCompany };
    await createWalletMutation.mutateAsync(data);
  }, [newDigitalWallet, selectedCompany, createWalletMutation]);
  
  const handleUpdateDigitalWallet = useCallback(async (walletData: DigitalWallet) => {
    if (!walletData) return;
    
    // Prepare the update data, excluding read-only fields
    const { id, createdAt, updatedAt, company, ...updateData } = walletData;
    
    await updateWalletMutation.mutateAsync({ id: walletData.id, data: updateData });
  }, [updateWalletMutation]);
  
  const handleDeleteDigitalWallet = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this digital wallet?')) {
      await deleteWalletMutation.mutateAsync(id);
    }
  }, [deleteWalletMutation]);
  
  // Expansion handlers
  const toggleBankExpansion = useCallback((id: string) => {
    setExpandedBanks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);
  
  const toggleWalletExpansion = useCallback((id: string) => {
    setExpandedWallets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);
  
  const toggleAllBanksExpansion = useCallback(() => {
    if (isAllBanksExpanded) {
      setExpandedBanks(new Set());
    } else {
      setExpandedBanks(new Set(filteredBankAccounts.map(bank => bank.id)));
    }
    setIsAllBanksExpanded(!isAllBanksExpanded);
  }, [isAllBanksExpanded, filteredBankAccounts]);
  
  const toggleAllWalletsExpansion = useCallback(() => {
    if (isAllWalletsExpanded) {
      setExpandedWallets(new Set());
    } else {
      setExpandedWallets(new Set(filteredDigitalWallets.map(wallet => wallet.id)));
    }
    setIsAllWalletsExpanded(!isAllWalletsExpanded);
  }, [isAllWalletsExpanded, filteredDigitalWallets]);
  
  return {
    // Data
    bankAccounts,
    digitalWallets,
    filteredBankAccounts,
    filteredDigitalWallets,
    
    // UI State
    isLoading,
    searchTerm,
    activeTab,
    expandedBanks,
    expandedWallets,
    isAllBanksExpanded,
    isAllWalletsExpanded,
    
    // Filter State
    viewFilter,
    currencyFilter,
    typeFilter,
    
    // Filter Data
    availableCurrencies,
    availableBankTypes,
    availableWalletTypes,
    
    // Dialog State
    showAddBankForm,
    showAddWalletForm,
    editingBank,
    editingWallet,
    newBankAccount,
    newDigitalWallet,
    
    // Actions
    setSearchTerm,
    setActiveTab,
    setShowAddBankForm,
    setShowAddWalletForm,
    setEditingBank,
    setEditingWallet,
    
    // Filter Actions
    setViewFilter: handleSetViewFilter,
    setCurrencyFilter,
    setTypeFilter,
    
    // Form handlers
    updateNewBankAccount,
    updateNewDigitalWallet,
    
    // CRUD operations
    handleCreateBankAccount,
    handleUpdateBankAccount,
    handleDeleteBankAccount,
    handleCreateDigitalWallet,
    handleUpdateDigitalWallet,
    handleDeleteDigitalWallet,
    
    // Utility
    toggleBankExpansion,
    toggleWalletExpansion,
    toggleAllBanksExpansion,
    toggleAllWalletsExpansion,
    resetForms
  };
};