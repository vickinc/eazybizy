import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Transaction, BankAccount, DigitalWallet, Company } from '@/types';
import { CashflowApiService } from '@/services/api/cashflowApiService';
import { 
  CashflowBusinessService,
  ManualCashflowEntry,
  NewManualEntry,
  AccountInfo,
  CashflowData,
  CashflowSummary,
  GroupedCashflow,
  EnhancedAccountInfo,
  EnhancedGroupedCashflow,
  EnhancedBankAccount,
  EnhancedDigitalWallet
} from '@/services/business/cashflowBusinessService';

export interface CashflowManagementDBHook {
  // Core Data
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  digitalWallets: DigitalWallet[];
  manualEntries: ManualCashflowEntry[];
  companies: Company[];
  
  // Computed Data  
  filteredTransactions: Transaction[];
  filteredManualEntries: ManualCashflowEntry[];
  allAccounts: AccountInfo[];
  enhancedGroupedCashflow: EnhancedGroupedCashflow[];
  enhancedBankAccounts: EnhancedBankAccount[];
  enhancedDigitalWallets: EnhancedDigitalWallet[];
  cashflowSummary: CashflowSummary;
  pageTitle: string;
  pageDescription: string;
  
  // UI State
  isLoaded: boolean;
  isLoading: boolean;
  selectedPeriod: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom';
  customDateRange: { start: string; end: string };
  groupBy: 'none' | 'month' | 'account' | 'currency';
  filterBy: 'all' | 'banks' | 'wallets';
  viewFilter: 'all' | 'automatic' | 'manual';
  groupedView: boolean;
  searchTerm: string;
  expandedGroups: Set<string>;
  isAllExpanded: boolean;
  showManualEntryDialog: boolean;
  newManualEntry: NewManualEntry;
  
  // Event Handlers
  setSelectedPeriod: (period: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom') => void;
  setCustomDateRange: (range: { start: string; end: string }) => void;
  setGroupBy: (groupBy: 'none' | 'month' | 'account' | 'currency') => void;
  setFilterBy: (filterBy: 'all' | 'banks' | 'wallets') => void;
  setViewFilter: (viewFilter: 'all' | 'automatic' | 'manual') => void;
  setGroupedView: (grouped: boolean) => void;
  setSearchTerm: (term: string) => void;
  setShowManualEntryDialog: (show: boolean) => void;
  updateNewManualEntry: (field: keyof NewManualEntry, value: string | number) => void;
  
  toggleGroupExpansion: (groupKey: string) => void;
  toggleAllExpansion: () => void;
  
  handleShowManualEntryDialog: () => void;
  handleCloseManualEntryDialog: () => void;
  handleCreateManualEntry: () => Promise<void>;
  
  // Utility Functions
  formatCurrency: (amount: number, currency?: string) => string;
}

// API functions (these would normally be in a separate service file)
const fetchTransactions = async (companyId: number | 'all') => {
  const response = await fetch(`/api/bookkeeping/transactions?companyId=${companyId}&take=1000`);
  if (!response.ok) throw new Error('Failed to fetch transactions');
  return response.json();
};

const fetchBankAccounts = async (companyId: number | 'all') => {
  const response = await fetch(`/api/bank-accounts?companyId=${companyId}`);
  if (!response.ok) throw new Error('Failed to fetch bank accounts');
  return response.json();
};

const fetchDigitalWallets = async (companyId: number | 'all') => {
  const response = await fetch(`/api/digital-wallets?companyId=${companyId}`);
  if (!response.ok) throw new Error('Failed to fetch digital wallets');
  return response.json();
};

export const useCashflowManagementDB = (
  selectedCompany: number | 'all',
  companies: Company[]
): CashflowManagementDBHook => {
  const queryClient = useQueryClient();

  // UI State
  const [selectedPeriod, setSelectedPeriod] = useState<'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom'>('thisMonth');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [groupBy, setGroupBy] = useState<'none' | 'month' | 'account' | 'currency'>('account');
  const [filterBy, setFilterBy] = useState<'all' | 'banks' | 'wallets'>('all');
  const [viewFilter, setViewFilter] = useState<'all' | 'automatic' | 'manual'>('all');
  const [groupedView, setGroupedView] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [showManualEntryDialog, setShowManualEntryDialog] = useState(false);
  const [newManualEntry, setNewManualEntry] = useState<NewManualEntry>(
    CashflowBusinessService.getInitialNewManualEntry()
  );

  // Track if we're in the hydration phase - must be before prefetching useEffect
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // React Query data fetching with optimized SSR support and intelligent prefetching
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isPlaceholderData: isTransactionsPlaceholder,
    isPending: isTransactionsPending
  } = useQuery({
    queryKey: ['transactions', selectedCompany],
    queryFn: () => fetchTransactions(selectedCompany),
    select: (data) => data?.data || [],
    // Optimized for SSR hydration
    placeholderData: [],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus for performance
    refetchOnMount: false, // Don't refetch on mount if we have fresh data
  });

  const {
    data: bankAccountsData,
    isLoading: isLoadingBankAccounts,
    isPlaceholderData: isBankAccountsPlaceholder,
    isPending: isBankAccountsPending
  } = useQuery({
    queryKey: ['bank-accounts', selectedCompany],
    queryFn: () => fetchBankAccounts(selectedCompany),
    select: (data) => data?.data || [],
    // Bank accounts change rarely, optimize accordingly
    placeholderData: [],
    staleTime: 30 * 60 * 1000, // 30 minutes - bank accounts change rarely
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: digitalWalletsData,
    isLoading: isLoadingDigitalWallets,
    isPlaceholderData: isDigitalWalletsPlaceholder,
    isPending: isDigitalWalletsPending
  } = useQuery({
    queryKey: ['digital-wallets', selectedCompany],
    queryFn: () => fetchDigitalWallets(selectedCompany),
    select: (data) => data?.data || [],
    // Wallets change rarely, optimize accordingly
    placeholderData: [],
    staleTime: 30 * 60 * 1000, // 30 minutes - wallets change rarely
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: manualEntriesData,
    isLoading: isLoadingManualEntries,
    isPlaceholderData: isManualEntriesPlaceholder,
    isPending: isManualEntriesPending
  } = useQuery({
    queryKey: ['manual-cashflow-entries', selectedCompany],
    queryFn: () => CashflowApiService.getManualCashflowEntries({ companyId: selectedCompany }),
    select: (data) => data?.data?.map(entry => ({
      id: entry.id,
      companyId: entry.companyId,
      accountId: entry.accountId,
      accountType: entry.accountType,
      type: entry.type,
      amount: entry.amount,
      currency: entry.currency,
      period: entry.period,
      description: entry.description,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    })) || [],
    // Manual entries are more dynamic
    placeholderData: [],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Prefetch related data for better performance
  const prefetchRelatedData = useCallback(() => {
    // Prefetch data for common filter combinations
    const commonFilters = [
      { companyId: selectedCompany, viewFilter: 'automatic' },
      { companyId: selectedCompany, viewFilter: 'manual' },
      { companyId: selectedCompany, filterBy: 'banks' },
      { companyId: selectedCompany, filterBy: 'wallets' }
    ];

    commonFilters.forEach(filter => {
      queryClient.prefetchQuery({
        queryKey: ['cashflow-filtered-data', selectedCompany, filter],
        queryFn: () => CashflowApiService.getManualCashflowEntries(filter),
        staleTime: 5 * 60 * 1000,
      });
    });

    // Prefetch period-specific data
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    const lastMonth = new Date(currentDate.setMonth(currentDate.getMonth() - 1)).toISOString().slice(0, 7);

    [currentMonth, lastMonth].forEach(period => {
      queryClient.prefetchQuery({
        queryKey: ['cashflow-period-data', selectedCompany, period],
        queryFn: () => CashflowApiService.getManualCashflowEntries({ 
          companyId: selectedCompany, 
          period 
        }),
        staleTime: 10 * 60 * 1000,
      });
    });
  }, [selectedCompany, queryClient]);

  // Trigger prefetching after hydration
  useEffect(() => {
    if (isHydrated && (transactionsData?.length > 0 || bankAccountsData?.length > 0)) {
      // Delay prefetching to avoid blocking main thread
      const timer = setTimeout(prefetchRelatedData, 1000);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, transactionsData, bankAccountsData, prefetchRelatedData]);

  // Create manual entry mutation
  const createManualEntryMutation = useMutation({
    mutationFn: CashflowApiService.createManualCashflowEntry,
    onSuccess: () => {
      // Invalidate and refetch manual entries
      queryClient.invalidateQueries({ queryKey: ['manual-cashflow-entries'] });
      toast.success('Manual cashflow entry created successfully');
    },
    onError: (error) => {
      console.error('Error creating manual cashflow entry:', error);
      toast.error('Failed to create manual cashflow entry');
    }
  });

  // Extract data with defaults
  const transactions = transactionsData || [];
  const bankAccounts = bankAccountsData || [];
  const digitalWallets = digitalWalletsData || [];
  const manualEntries = manualEntriesData || [];

  // Loading state logic that handles SSR hydration properly
  const isActuallyLoading = isLoadingTransactions || isLoadingBankAccounts || isLoadingDigitalWallets || isLoadingManualEntries;
  
  // During SSR and initial hydration, assume we have data (prevents loading screen flash)
  // Only show loading after hydration if we're actually loading and have no data
  const hasData = transactions.length > 0 || bankAccounts.length > 0 || digitalWallets.length > 0 || manualEntries.length > 0;
  
  // Show loading immediately on navigation for better UX, then rely on cached/SSR data
  const isLoading = isHydrated ? (isActuallyLoading && !hasData) : isActuallyLoading;
  const isLoaded = isHydrated ? !isLoading : !isActuallyLoading; // Show skeleton during initial load

  // Computed data using business service
  const filteredTransactions = useMemo(() => {
    return CashflowBusinessService.getFilteredTransactions(
      transactions,
      selectedCompany,
      selectedPeriod,
      customDateRange,
      filterBy
    );
  }, [transactions, selectedCompany, selectedPeriod, customDateRange, filterBy]);

  const filteredManualEntries = useMemo(() => {
    return CashflowBusinessService.getFilteredManualEntries(
      manualEntries,
      selectedCompany,
      selectedPeriod,
      customDateRange,
      filterBy
    );
  }, [manualEntries, selectedCompany, selectedPeriod, customDateRange, filterBy]);

  const allAccounts = useMemo(() => {
    const accounts = CashflowBusinessService.getAllAccounts(
      bankAccounts,
      digitalWallets,
      selectedCompany
    );

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      return accounts.filter(account => 
        account.name.toLowerCase().includes(searchLower) ||
        account.currency.toLowerCase().includes(searchLower) ||
        companies.find(c => c.id === account.companyId)?.tradingName.toLowerCase().includes(searchLower)
      );
    }

    return accounts;
  }, [bankAccounts, digitalWallets, selectedCompany, searchTerm, companies]);

  const enhancedGroupedCashflow = useMemo(() => {
    return CashflowBusinessService.getEnhancedGroupedCashflow(
      allAccounts,
      companies,
      filteredTransactions,
      filteredManualEntries,
      groupBy,
      groupedView,
      viewFilter
    );
  }, [allAccounts, companies, filteredTransactions, filteredManualEntries, groupBy, groupedView, viewFilter]);

  const enhancedBankAccounts = useMemo(() => {
    return CashflowBusinessService.createEnhancedBankAccounts(
      bankAccounts,
      companies,
      selectedCompany
    );
  }, [bankAccounts, companies, selectedCompany]);

  const enhancedDigitalWallets = useMemo(() => {
    return CashflowBusinessService.createEnhancedDigitalWallets(
      digitalWallets,
      companies,
      selectedCompany
    );
  }, [digitalWallets, companies, selectedCompany]);

  const cashflowSummary = useMemo(() => {
    return CashflowBusinessService.calculateSummary(
      allAccounts,
      filteredTransactions,
      filteredManualEntries,
      viewFilter
    );
  }, [allAccounts, filteredTransactions, filteredManualEntries, viewFilter]);

  // Pre-computed display data
  const pageTitle = useMemo(() => {
    if (selectedCompany === 'all') {
      return 'Cash Flow Analysis';
    }
    const company = companies.find(c => c.id === selectedCompany);
    return company ? `${company.tradingName} - Cash Flow` : 'Cash Flow Analysis';
  }, [selectedCompany, companies]);

  const pageDescription = useMemo(() => {
    if (selectedCompany === 'all') {
      return 'Track automatic and manual cash flow for all banks and wallets across companies';
    }
    const company = companies.find(c => c.id === selectedCompany);
    return company 
      ? `Cash flow analysis for ${company.tradingName} - automatic from transactions and manual entries`
      : 'Track automatic and manual cash flow for all banks and wallets';
  }, [selectedCompany, companies]);

  // Event handlers
  const toggleGroupExpansion = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  const toggleAllExpansion = useCallback(() => {
    const allGroupKeys = enhancedGroupedCashflow.map(g => g.key);
    if (isAllExpanded) {
      setExpandedGroups(new Set());
    } else {
      setExpandedGroups(new Set(allGroupKeys));
    }
    setIsAllExpanded(!isAllExpanded);
  }, [enhancedGroupedCashflow, isAllExpanded]);

  const updateNewManualEntry = useCallback((field: keyof NewManualEntry, value: string | number) => {
    setNewManualEntry(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleShowManualEntryDialog = useCallback(() => {
    if (selectedCompany === 'all') {
      toast.error('Please select a specific company to add manual cashflow entries.');
      return;
    }
    setNewManualEntry(prev => ({ 
      ...CashflowBusinessService.getInitialNewManualEntry(),
      companyId: selectedCompany as number 
    }));
    setShowManualEntryDialog(true);
  }, [selectedCompany]);

  const handleCloseManualEntryDialog = useCallback(() => {
    setShowManualEntryDialog(false);
    setNewManualEntry(CashflowBusinessService.getInitialNewManualEntry());
  }, []);

  const handleCreateManualEntry = useCallback(async () => {
    const validation = CashflowBusinessService.validateManualEntry(newManualEntry);
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    try {
      await createManualEntryMutation.mutateAsync({
        companyId: newManualEntry.companyId,
        accountId: newManualEntry.accountId,
        accountType: newManualEntry.accountType,
        type: newManualEntry.type,
        amount: newManualEntry.amount,
        currency: newManualEntry.currency,
        period: newManualEntry.period,
        description: newManualEntry.description,
        notes: newManualEntry.notes,
      });

      setShowManualEntryDialog(false);
      setNewManualEntry(CashflowBusinessService.getInitialNewManualEntry());
    } catch (error) {
      // Error already handled by mutation
    }
  }, [newManualEntry, createManualEntryMutation]);

  // Utility functions
  const formatCurrency = useCallback((amount: number, currency: string = 'USD'): string => {
    return CashflowBusinessService.formatCurrency(amount, currency);
  }, []);

  return {
    // Core Data
    transactions,
    bankAccounts,
    digitalWallets,
    manualEntries,
    companies,
    
    // Computed Data
    filteredTransactions,
    filteredManualEntries,
    allAccounts,
    enhancedGroupedCashflow,
    enhancedBankAccounts,
    enhancedDigitalWallets,
    cashflowSummary,
    pageTitle,
    pageDescription,
    
    // UI State
    isLoaded,
    isLoading,
    selectedPeriod,
    customDateRange,
    groupBy,
    filterBy,
    viewFilter,
    groupedView,
    searchTerm,
    expandedGroups,
    isAllExpanded,
    showManualEntryDialog,
    newManualEntry,
    
    // Event Handlers
    setSelectedPeriod,
    setCustomDateRange,
    setGroupBy,
    setFilterBy,
    setViewFilter,
    setGroupedView,
    setSearchTerm,
    setShowManualEntryDialog,
    updateNewManualEntry,
    
    toggleGroupExpansion,
    toggleAllExpansion,
    
    handleShowManualEntryDialog,
    handleCloseManualEntryDialog,
    handleCreateManualEntry,
    
    // Utility Functions
    formatCurrency
  };
};