import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  Transaction,
  BankAccount,
  DigitalWallet,
  BookkeepingEntry,
  Company
} from '@/types';
import { TransactionsStorageService } from '@/services/storage/transactionsStorageService';
import { TransactionsBusinessService, BulkTransaction } from '@/services/business/transactionsBusinessService';
import { getLocalDateString } from '@/utils';

// Enhanced transaction interface with embedded data
interface EnhancedTransaction extends Transaction {
  account?: BankAccount | DigitalWallet;
  linkedEntry?: BookkeepingEntry;
  company?: Company;
}

export interface TransactionsManagementHook {
  // Core Data
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  digitalWallets: DigitalWallet[];
  entries: BookkeepingEntry[];
  companies: Company[];
  
  // Computed Data
  filteredTransactions: EnhancedTransaction[];
  groupedTransactions: Array<{ key: string; name: string; transactions: EnhancedTransaction[] }>;
  linkableEntriesByType: { income: BookkeepingEntry[]; expense: BookkeepingEntry[] };
  linkableEntries: BookkeepingEntry[];
  transactionsSummary: {
    totalTransactions: number;
    totalIncoming: number;
    totalOutgoing: number;
    netAmount: number;
    thisMonth: number;
  };
  pageTitle: string;
  pageDescription: string;
  
  // UI State
  isLoaded: boolean;
  selectedPeriod: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom';
  customDateRange: { start: string; end: string };
  groupBy: 'none' | 'month' | 'account' | 'currency';
  filterBy: 'all' | 'banks' | 'wallets';
  viewFilter: 'all' | 'incoming' | 'outgoing';
  groupedView: boolean;
  searchTerm: string;
  expandedTransactions: Set<string>;
  expandedGroups: Set<string>;
  isAllExpanded: boolean;
  selectedTransactions: Set<string>;
  showLinkEntryDialog: boolean;
  linkingTransactionId: string;
  showBulkAddDialog: boolean;
  bulkAddType: 'incoming' | 'outgoing';
  showDeleteConfirmDialog: boolean;
  bulkTransactions: BulkTransaction[];
  bulkSelectedAccountId: string;
  
  // Event Handlers
  setSelectedPeriod: (period: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom') => void;
  setCustomDateRange: (range: { start: string; end: string }) => void;
  setGroupBy: (groupBy: 'none' | 'month' | 'account' | 'currency') => void;
  setFilterBy: (filterBy: 'all' | 'banks' | 'wallets') => void;
  setViewFilter: (viewFilter: 'all' | 'incoming' | 'outgoing') => void;
  setGroupedView: (grouped: boolean) => void;
  setSearchTerm: (term: string) => void;
  setShowLinkEntryDialog: (show: boolean) => void;
  setShowBulkAddDialog: (show: boolean) => void;
  setShowDeleteConfirmDialog: (show: boolean) => void;
  setBulkAddType: (type: 'incoming' | 'outgoing') => void;
  setBulkSelectedAccountId: (accountId: string) => void;
  setLinkingTransactionId: (id: string) => void;
  
  toggleTransactionExpansion: (transactionId: string) => void;
  toggleGroupExpansion: (groupKey: string) => void;
  toggleAllExpansion: () => void;
  toggleTransactionSelection: (transactionId: string) => void;
  toggleSelectAll: () => void;
  
  handleDeleteTransaction: (id: string) => void;
  handleLinkEntry: (transactionId: string, entryId: string) => void;
  handleBulkDelete: () => void;
  confirmBulkDelete: () => void;
  
  // High-level handlers (moved from component)
  handleShowBulkAdd: (type: 'incoming' | 'outgoing') => void;
  handleLinkTransaction: (transactionId: string) => void;
  handleUnlinkTransaction: (transactionId: string) => void;
  handleLinkEntrySelect: (entryId: string) => void;
  
  // Dialog close handlers
  handleCloseLinkDialog: () => void;
  handleCloseBulkAddDialog: () => void;
  
  // Bulk Operations
  addBulkTransactionRow: () => void;
  removeBulkTransactionRow: (index: number) => void;
  updateBulkTransaction: (index: number, field: string, value: string) => void;
  handleBulkCreate: () => void;
  resetBulkForm: () => void;
  
  // Utility Functions
  formatCurrency: (amount: number, currency?: string) => string;
  getAccountById: (accountId: string, accountType: 'bank' | 'wallet') => BankAccount | DigitalWallet | undefined;
  getEntryById: (entryId: string) => BookkeepingEntry | undefined;
  getCompanyById: (companyId: number) => Company | undefined;
}

export const useTransactionsManagement = (
  selectedCompany: number | 'all',
  companies: Company[]
): TransactionsManagementHook => {
  // Core Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [digitalWallets, setDigitalWallets] = useState<DigitalWallet[]>([]);
  const [entries, setEntries] = useState<BookkeepingEntry[]>([]);
  
  // UI State
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom'>('thisMonth');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [groupBy, setGroupBy] = useState<'none' | 'month' | 'account' | 'currency'>('none');
  const [filterBy, setFilterBy] = useState<'all' | 'banks' | 'wallets'>('all');
  const [viewFilter, setViewFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [groupedView, setGroupedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [showLinkEntryDialog, setShowLinkEntryDialog] = useState(false);
  const [linkingTransactionId, setLinkingTransactionId] = useState<string>('');
  const [showBulkAddDialog, setShowBulkAddDialog] = useState(false);
  const [bulkAddType, setBulkAddType] = useState<'incoming' | 'outgoing'>('incoming');
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [bulkSelectedAccountId, setBulkSelectedAccountId] = useState<string>('');
  const [bulkTransactions, setBulkTransactions] = useState<BulkTransaction[]>([
    {
      paidBy: '',
      paidTo: '',
      reference: '',
      amount: '',
      tax: '0',
      category: '',
      description: '',
      notes: '',
      date: getLocalDateString(),
      currency: 'USD',
      accountId: '',
      linkedEntryId: ''
    }
  ]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedTransactions, loadedBankAccounts, loadedDigitalWallets, loadedEntries] = await Promise.all([
          TransactionsStorageService.getTransactions(),
          TransactionsStorageService.getBankAccounts(),
          TransactionsStorageService.getDigitalWallets(),
          TransactionsStorageService.getBookkeepingEntries()
        ]);
        
        setTransactions(loadedTransactions);
        setBankAccounts(loadedBankAccounts);
        setDigitalWallets(loadedDigitalWallets);
        setEntries(loadedEntries);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading transaction data:', error);
        toast.error('Failed to load transaction data');
        setIsLoaded(true);
      }
    };
    
    loadData();
  }, []);

  // Save transactions when they change
  useEffect(() => {
    if (isLoaded) {
      TransactionsStorageService.saveTransactions(transactions);
    }
  }, [transactions, isLoaded]);

  // Computed data with enhanced transactions
  const enhancedTransactions: EnhancedTransaction[] = useMemo(() => {
    return transactions.map(transaction => ({
      ...transaction,
      account: TransactionsBusinessService.getAccountById(
        transaction.accountId, 
        transaction.accountType, 
        bankAccounts, 
        digitalWallets
      ),
      linkedEntry: transaction.linkedEntryId ? entries.find(e => e.id === transaction.linkedEntryId) : undefined,
      company: companies.find(c => c.id === transaction.companyId)
    }));
  }, [transactions, bankAccounts, digitalWallets, entries, companies]);

  const filteredTransactions = useMemo(() => {
    const filtered = TransactionsBusinessService.getFilteredTransactions(
      enhancedTransactions,
      selectedCompany,
      selectedPeriod,
      customDateRange,
      filterBy,
      viewFilter,
      searchTerm
    );
    return filtered as EnhancedTransaction[];
  }, [enhancedTransactions, selectedCompany, selectedPeriod, customDateRange, filterBy, viewFilter, searchTerm]);

  const groupedTransactions = useMemo(() => {
    return TransactionsBusinessService.groupTransactions(
      groupedView ? filteredTransactions : filteredTransactions,
      groupedView ? groupBy : 'none',
      bankAccounts,
      digitalWallets
    ) as Array<{ key: string; name: string; transactions: EnhancedTransaction[] }>;
  }, [filteredTransactions, groupedView, groupBy, bankAccounts, digitalWallets]);

  const linkableEntriesByType = TransactionsBusinessService.getLinkableEntriesByType(
    entries,
    transactions,
    selectedCompany
  );

  const linkableEntries = TransactionsBusinessService.getLinkableEntries(
    entries,
    transactions,
    bulkAddType,
    selectedCompany
  );

  const transactionsSummary = TransactionsBusinessService.calculateSummary(filteredTransactions);

  // Pre-computed display data
  const pageTitle = useMemo(() => {
    if (selectedCompany === 'all') {
      return 'Transactions';
    }
    const company = companies.find(c => c.id === selectedCompany);
    return company ? `${company.tradingName} - Transactions` : 'Transactions';
  }, [selectedCompany, companies]);

  const pageDescription = useMemo(() => {
    if (selectedCompany === 'all') {
      return 'Manage incoming and outgoing transactions across all companies';
    }
    const company = companies.find(c => c.id === selectedCompany);
    return company 
      ? `Managing transactions for ${company.tradingName}` 
      : 'Manage incoming and outgoing transactions';
  }, [selectedCompany, companies]);

  // Event handlers
  const toggleTransactionExpansion = useCallback((transactionId: string) => {
    setExpandedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  }, []);

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
    const allTransactionIds = filteredTransactions.map(t => t.id);
    if (isAllExpanded) {
      setExpandedTransactions(new Set());
    } else {
      setExpandedTransactions(new Set(allTransactionIds));
    }
    setIsAllExpanded(!isAllExpanded);
  }, [filteredTransactions, isAllExpanded]);

  const toggleTransactionSelection = useCallback((transactionId: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
    }
  }, [selectedTransactions.size, filteredTransactions]);

  const handleDeleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    toast.success('Transaction deleted successfully');
  }, []);

  const handleLinkEntry = useCallback((transactionId: string, entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    
    setTransactions(prev => prev.map(t => {
      if (t.id === transactionId) {
        return {
          ...t,
          linkedEntryId: entryId || undefined,
          linkedEntryType: entryId && entry ? entry.type : undefined,
          category: entryId && entry ? entry.category : t.category,
          description: entryId && entry ? entry.description : t.description,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));
    
    setShowLinkEntryDialog(false);
    setLinkingTransactionId('');
    
    if (entryId) {
      toast.success('Transaction linked to entry successfully');
    } else {
      toast.success('Transaction unlinked successfully');
    }
  }, [entries]);

  const handleBulkDelete = useCallback(() => {
    if (selectedTransactions.size === 0) return;
    setShowDeleteConfirmDialog(true);
  }, [selectedTransactions.size]);

  const confirmBulkDelete = useCallback(() => {
    setTransactions(prev => prev.filter(transaction => !selectedTransactions.has(transaction.id)));
    setSelectedTransactions(new Set());
    setShowDeleteConfirmDialog(false);
    toast.success(`Successfully deleted ${selectedTransactions.size} transaction${selectedTransactions.size === 1 ? '' : 's'}`);
  }, [selectedTransactions]);

  // Bulk operations
  const addBulkTransactionRow = useCallback(() => {
    setBulkTransactions(prev => [...prev, {
      paidBy: '',
      paidTo: '',
      reference: '',
      amount: '',
      tax: '0',
      category: '',
      description: '',
      notes: '',
      date: getLocalDateString(),
      currency: 'USD',
      accountId: '',
      linkedEntryId: ''
    }]);
  }, []);

  const removeBulkTransactionRow = useCallback((index: number) => {
    if (bulkTransactions.length > 1) {
      setBulkTransactions(prev => prev.filter((_, i) => i !== index));
    }
  }, [bulkTransactions.length]);

  const updateBulkTransaction = useCallback((index: number, field: string, value: string) => {
    setBulkTransactions(prev => {
      const newBulkTransactions = [...prev];
      let updatedTransaction = { ...newBulkTransactions[index], [field]: value };

      if (field === 'linkedEntryId' && value) {
        const entry = entries.find(e => e.id === value);
        if (entry) {
          updatedTransaction = TransactionsBusinessService.updateBulkTransactionFromEntry(
            updatedTransaction,
            entry,
            bulkAddType
          );
        }
      }
      
      newBulkTransactions[index] = updatedTransaction;
      return newBulkTransactions;
    });
  }, [entries, bulkAddType]);

  const handleBulkCreate = useCallback(() => {
    if (!selectedCompany || selectedCompany === 'all') {
      toast.error('Please select a company first');
      return;
    }
    if (!bulkSelectedAccountId) {
      toast.error('Please select an account to add transactions to.');
      return;
    }

    const validTransactions = TransactionsBusinessService.validateBulkTransactions(bulkTransactions, bulkAddType);

    if (validTransactions.length === 0) {
      const requiredField = bulkAddType === 'incoming' ? 'Paid By' : 'Paid To';
      toast.error(`Please fill in at least one complete transaction (amount and ${requiredField} are required)`);
      return;
    }

    const newTransactions = validTransactions.map(transaction => 
      TransactionsBusinessService.createTransactionFromBulk(
        transaction,
        bulkAddType,
        selectedCompany as number,
        bulkSelectedAccountId,
        companies,
        bankAccounts
      )
    );

    setTransactions(prev => [...newTransactions, ...prev]);
    setShowBulkAddDialog(false);
    resetBulkForm();
    
    toast.success(`Successfully created ${validTransactions.length} ${bulkAddType} transaction${validTransactions.length === 1 ? '' : 's'}`);
  }, [selectedCompany, bulkSelectedAccountId, bulkTransactions, bulkAddType, companies, bankAccounts]);

  const resetBulkForm = useCallback(() => {
    const defaultAccountId = TransactionsBusinessService.getMostUsedAccountForCompany(
      transactions,
      bankAccounts,
      digitalWallets,
      selectedCompany
    );
    setBulkSelectedAccountId(defaultAccountId);
    setBulkTransactions([{
      paidBy: '',
      paidTo: '',
      reference: '',
      amount: '',
      tax: '0',
      category: '',
      description: '',
      notes: '',
      date: getLocalDateString(),
      currency: 'USD',
      accountId: '',
      linkedEntryId: ''
    }]);
  }, [transactions, bankAccounts, digitalWallets, selectedCompany]);

  // High-level handlers (moved from component)
  const handleShowBulkAdd = useCallback((type: 'incoming' | 'outgoing') => {
    if (!selectedCompany || selectedCompany === 'all') {
      toast.error('Please select a specific company to add transactions.');
      return;
    }
    setBulkAddType(type);
    resetBulkForm();
    setShowBulkAddDialog(true);
  }, [selectedCompany, setBulkAddType, setShowBulkAddDialog, resetBulkForm]);

  const handleLinkTransaction = useCallback((transactionId: string) => {
    setLinkingTransactionId(transactionId);
    setShowLinkEntryDialog(true);
  }, []);

  const handleUnlinkTransaction = useCallback((transactionId: string) => {
    handleLinkEntry(transactionId, '');
  }, [handleLinkEntry]);

  const handleLinkEntrySelect = useCallback((entryId: string) => {
    handleLinkEntry(linkingTransactionId, entryId);
  }, [handleLinkEntry, linkingTransactionId]);

  // Dialog close handlers
  const handleCloseLinkDialog = useCallback(() => {
    setShowLinkEntryDialog(false);
  }, []);

  const handleCloseBulkAddDialog = useCallback(() => {
    setShowBulkAddDialog(false);
  }, []);

  // Utility functions
  const formatCurrency = useCallback((amount: number, currency: string = 'USD'): string => {
    return TransactionsBusinessService.formatCurrency(amount, currency);
  }, []);

  const getAccountById = useCallback((accountId: string, accountType: 'bank' | 'wallet'): BankAccount | DigitalWallet | undefined => {
    return TransactionsBusinessService.getAccountById(accountId, accountType, bankAccounts, digitalWallets);
  }, [bankAccounts, digitalWallets]);

  const getEntryById = useCallback((entryId: string): BookkeepingEntry | undefined => {
    return entries.find(entry => entry.id === entryId);
  }, [entries]);

  const getCompanyById = useCallback((companyId: number): Company | undefined => {
    return companies.find(c => c.id === companyId);
  }, [companies]);

  return {
    // Core Data
    transactions,
    bankAccounts,
    digitalWallets,
    entries,
    companies,
    
    // Computed Data
    filteredTransactions,
    groupedTransactions,
    linkableEntriesByType,
    linkableEntries,
    transactionsSummary,
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
    expandedTransactions,
    expandedGroups,
    isAllExpanded,
    selectedTransactions,
    showLinkEntryDialog,
    linkingTransactionId,
    showBulkAddDialog,
    bulkAddType,
    showDeleteConfirmDialog,
    bulkTransactions,
    bulkSelectedAccountId,
    
    // Event Handlers
    setSelectedPeriod,
    setCustomDateRange,
    setGroupBy,
    setFilterBy,
    setViewFilter,
    setGroupedView,
    setSearchTerm,
    setShowLinkEntryDialog,
    setShowBulkAddDialog,
    setShowDeleteConfirmDialog,
    setBulkAddType,
    setBulkSelectedAccountId,
    setLinkingTransactionId,
    
    toggleTransactionExpansion,
    toggleGroupExpansion,
    toggleAllExpansion,
    toggleTransactionSelection,
    toggleSelectAll,
    
    handleDeleteTransaction,
    handleLinkEntry,
    handleBulkDelete,
    confirmBulkDelete,
    
    // High-level handlers (moved from component)
    handleShowBulkAdd,
    handleLinkTransaction,
    handleUnlinkTransaction,
    handleLinkEntrySelect,
    
    // Dialog close handlers
    handleCloseLinkDialog,
    handleCloseBulkAddDialog,
    
    // Bulk Operations
    addBulkTransactionRow,
    removeBulkTransactionRow,
    updateBulkTransaction,
    handleBulkCreate,
    resetBulkForm,
    
    // Utility Functions
    formatCurrency,
    getAccountById,
    getEntryById,
    getCompanyById
  };
};