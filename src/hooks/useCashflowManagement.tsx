import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Transaction, BankAccount, DigitalWallet, Company } from '@/types';
import { CashflowStorageService } from '@/services/storage/cashflowStorageService';
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

export interface CashflowManagementHook {
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
  handleCreateManualEntry: () => void;
  
  // Utility Functions (only formatCurrency needed for main page summary)
  formatCurrency: (amount: number, currency?: string) => string;
}

export const useCashflowManagement = (
  selectedCompany: number | 'all',
  companies: Company[]
): CashflowManagementHook => {
  // Core Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [digitalWallets, setDigitalWallets] = useState<DigitalWallet[]>([]);
  const [manualEntries, setManualEntries] = useState<ManualCashflowEntry[]>([]);
  
  // UI State
  const [isLoaded, setIsLoaded] = useState(false);
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

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await CashflowStorageService.loadAllCashflowData();
        
        setTransactions(data.transactions);
        setBankAccounts(data.bankAccounts);
        setDigitalWallets(data.digitalWallets);
        setManualEntries(data.manualEntries);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading cashflow data:', error);
        toast.error('Failed to load cashflow data');
        setIsLoaded(true);
      }
    };
    
    loadData();
  }, []);

  // Save manual entries when they change
  useEffect(() => {
    if (isLoaded) {
      CashflowStorageService.saveManualCashflowEntries(manualEntries);
    }
  }, [manualEntries, isLoaded]);

  // Computed data
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

  const handleCreateManualEntry = useCallback(() => {
    const validation = CashflowBusinessService.validateManualEntry(newManualEntry);
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const entry = CashflowBusinessService.createManualEntry(newManualEntry);
    setManualEntries(prev => [entry, ...prev]);
    setShowManualEntryDialog(false);
    setNewManualEntry(CashflowBusinessService.getInitialNewManualEntry());
    toast.success('Manual cashflow entry created successfully');
  }, [newManualEntry]);

  // Utility functions (minimal - only what main page needs)
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
    
    // Utility Functions (minimal - only what main page needs)
    formatCurrency
  };
};