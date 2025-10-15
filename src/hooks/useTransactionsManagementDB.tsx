"use client";

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { TransactionApiService, TransactionQueryParams, TransactionFormData, TransactionItem } from '@/services/api/transactionApiService';
import { PeriodFilterService, PeriodPreset, DateRange } from '@/services/utils/periodFilterService';
import { LiveCryptoTransactionService, CryptoWallet, LiveTransactionOptions } from '@/services/business/liveCryptoTransactionService';
import type { Company } from '@/types/company.types';

interface UseTransactionsManagementDBOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  cacheTime?: number;
  disableLiveCrypto?: boolean;
}

export interface TransactionFilters {
  searchTerm: string;
  status: 'all' | 'pending' | 'cleared' | 'cancelled';
  reconciliationStatus: 'all' | 'unreconciled' | 'reconciled' | 'auto_reconciled';
  approvalStatus: 'all' | 'pending' | 'approved' | 'rejected';
  accountId: string;
  accountType: 'all' | 'bank' | 'wallet';
  currency: string;
  blockchain: 'all' | 'tron' | 'ethereum' | 'binance-smart-chain';
  transactionType: 'all' | 'blockchain' | 'manual';
  tokenType: 'all' | 'native' | 'trc20' | 'erc20';
  dateRange: PeriodPreset;
  dateFrom: string;
  dateTo: string;
  customDateFrom: Date | null;
  customDateTo: Date | null;
  sortField: 'date' | 'paidBy' | 'paidTo' | 'netAmount' | 'currency' | 'category' | 'status' | 'createdAt' | 'updatedAt';
  sortDirection: 'asc' | 'desc';
}

export interface TransactionGrouping {
  groupBy: 'none' | 'date' | 'category' | 'account' | 'status' | 'currency';
  groupedView: boolean;
}

export interface TransactionUIState {
  selectedTransactions: Set<string>;
  expandedGroups: Set<string>;
  expandedTransactions: Set<string>;
  showBulkAddDialog: boolean;
  showLinkEntryDialog: boolean;
  showDeleteConfirmDialog: boolean;
  linkingTransactionId: string;
  bulkAddType: 'incoming' | 'outgoing';
}

/**
 * Enhanced transactions management hook with database persistence
 * Uses React Query for optimized data fetching, caching, and state management
 */
export function useTransactionsManagementDB(
  selectedCompany: number | 'all',
  companies: Company[],
  options: UseTransactionsManagementDBOptions = {}
) {
  const queryClient = useQueryClient();
  
  const {
    enabled = true,
    refetchInterval = 30000, // 30 seconds
    staleTime = 60000, // 1 minute
    cacheTime = 300000, // 5 minutes
    disableLiveCrypto = false,
  } = options;

  // Filter State
  const [filters, setFilters] = useState<TransactionFilters>({
    searchTerm: '',
    status: 'all',
    reconciliationStatus: 'all',
    approvalStatus: 'all',
    accountId: 'all',
    accountType: 'all',
    currency: 'all',
    blockchain: 'all',
    transactionType: 'all',
    tokenType: 'all',
    dateRange: 'all',
    dateFrom: '',
    dateTo: '',
    customDateFrom: null,
    customDateTo: null,
    sortField: 'date',
    sortDirection: 'desc',
  });

  // Grouping State
  const [grouping, setGrouping] = useState<TransactionGrouping>({
    groupBy: 'none',
    groupedView: false,
  });

  // UI State
  const [uiState, setUIState] = useState<TransactionUIState>({
    selectedTransactions: new Set(),
    expandedGroups: new Set(),
    expandedTransactions: new Set(),
    showBulkAddDialog: false,
    showLinkEntryDialog: false,
    showDeleteConfirmDialog: false,
    linkingTransactionId: '',
    bulkAddType: 'incoming',
  });

  // Bulk Add State
  const [bulkTransactions, setBulkTransactions] = useState<Partial<TransactionFormData>[]>([]);
  const [bulkSelectedAccountId, setBulkSelectedAccountId] = useState<string>('');

  // Build query parameters with enhanced period filtering
  const queryParams = useMemo((): TransactionQueryParams => {
    // Get the actual date range based on the selected period
    const customRange = filters.customDateFrom && filters.customDateTo ? 
      { startDate: filters.customDateFrom, endDate: filters.customDateTo } : undefined;
    
    const actualDateRange = PeriodFilterService.convertPresetToDateRange(filters.dateRange, customRange);
    const dateParams = actualDateRange ? PeriodFilterService.dateRangeToQueryParams(actualDateRange) : {};

    // Handle date filtering logic
    let dateFilterParams = {};
    
    if (filters.dateRange === 'all') {
      // For 'all' period, we now have a wide date range from the service
      // Use it to ensure consistent behavior between database and live crypto fetching
      if (dateParams.dateFrom && dateParams.dateTo) {
        dateFilterParams = {
          dateFrom: dateParams.dateFrom,
          dateTo: dateParams.dateTo
        };
      }
    } else if (filters.dateRange === 'custom') {
      // Use custom date range if available
      if (dateParams.dateFrom && dateParams.dateTo) {
        dateFilterParams = {
          dateFrom: dateParams.dateFrom,
          dateTo: dateParams.dateTo
        };
      }
    } else {
      // For all preset periods, convert to date range and send as custom
      // This ensures consistent behavior regardless of backend period support
      if (dateParams.dateFrom && dateParams.dateTo) {
        dateFilterParams = {
          dateFrom: dateParams.dateFrom,
          dateTo: dateParams.dateTo
        };
      }
    }

    const params = {
      companyId: selectedCompany,
      searchTerm: filters.searchTerm || undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      reconciliationStatus: filters.reconciliationStatus !== 'all' ? filters.reconciliationStatus : undefined,
      approvalStatus: filters.approvalStatus !== 'all' ? filters.approvalStatus : undefined,
      accountId: filters.accountId !== 'all' ? filters.accountId : undefined,
      accountType: filters.accountType !== 'all' ? filters.accountType : undefined,
      currency: filters.currency !== 'all' ? filters.currency : undefined,
      blockchain: filters.blockchain !== 'all' ? filters.blockchain : undefined,
      transactionType: filters.transactionType !== 'all' ? filters.transactionType : undefined,
      tokenType: filters.tokenType !== 'all' ? filters.tokenType : undefined,
      sortField: filters.sortField,
      sortDirection: filters.sortDirection,
      take: 10000, // Increased limit to show all available transactions
      ...dateFilterParams
    };

    // Debug logging in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Transaction query params:', {
        period: filters.dateRange,
        actualDateRange,
        dateParams,
        finalParams: params
      });
    }

    return params;
  }, [selectedCompany, filters]);

  // Query key for caching
  const queryKey = useMemo(() => [
    'transactions',
    {
      company: selectedCompany,
      ...queryParams
    }
  ], [selectedCompany, queryParams]);

  // Crypto wallets query (for live crypto transactions)
  const {
    data: cryptoWallets,
    isLoading: isLoadingWallets,
  } = useQuery({
    queryKey: ['crypto-wallets', selectedCompany],
    queryFn: () => LiveCryptoTransactionService.getCryptoWalletsForCompany(selectedCompany),
    enabled: enabled && (selectedCompany !== undefined),
    staleTime: 300000, // 5 minutes (wallets don't change often)
    cacheTime: 600000, // 10 minutes
    retry: 1,
  });

  // Live crypto transactions query
  const {
    data: liveCryptoTransactions,
    isLoading: isLoadingLiveCrypto,
    isError: isLiveCryptoError,
    error: liveCryptoError
  } = useQuery({
    queryKey: ['live-crypto-transactions', selectedCompany, queryParams],
    queryFn: async () => {
      if (!cryptoWallets || cryptoWallets.length === 0) {
        console.log('🔍 No crypto wallets found for live transaction fetching');
        return [];
      }

      // Get the actual date range based on the selected period
      const customRange = filters.customDateFrom && filters.customDateTo ? 
        { startDate: filters.customDateFrom, endDate: filters.customDateTo } : undefined;
      
      const actualDateRange = PeriodFilterService.convertPresetToDateRange(filters.dateRange, customRange);
      
      if (!actualDateRange) {
        console.log('🔍 No date range available for live crypto transactions');
        return [];
      }

      const liveTransactionOptions: LiveTransactionOptions = {
        dateRange: actualDateRange,
        limit: 2000, // Increased limit to capture more transactions
        companyId: selectedCompany
      };

      // Filter wallets based on blockchain and currency selections
      let filteredWallets = cryptoWallets;
      
      // Filter by blockchain if specific blockchain is selected
      if (filters.blockchain && filters.blockchain !== 'all') {
        filteredWallets = filteredWallets.filter(wallet => 
          wallet.blockchain?.toLowerCase() === filters.blockchain?.toLowerCase()
        );
        console.log(`🔍 Filtered to ${filters.blockchain} blockchain: ${filteredWallets.length} wallets`);
      }
      
      // Filter by currency if specific currency is selected
      if (filters.currency && filters.currency !== 'all') {
        filteredWallets = filteredWallets.filter(wallet => 
          wallet.currency?.toUpperCase() === filters.currency?.toUpperCase()
        );
        console.log(`🔍 Filtered to ${filters.currency} currency: ${filteredWallets.length} wallets`);
      }

      console.log('🚀 Fetching live crypto transactions:', {
        originalWalletCount: cryptoWallets.length,
        filteredWalletCount: filteredWallets.length,
        blockchain: filters.blockchain,
        currency: filters.currency,
        dateRange: actualDateRange,
        period: filters.dateRange
      });

      return await LiveCryptoTransactionService.fetchTransactionsForPeriod(
        filteredWallets,
        liveTransactionOptions
      );
    },
    enabled: enabled && !disableLiveCrypto && (selectedCompany !== undefined) && !!cryptoWallets && cryptoWallets.length > 0,
    staleTime: 60000, // 1 minute (live data should be relatively fresh)
    cacheTime: 300000, // 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Main database transactions query
  const {
    data: transactionsData,
    isLoading: isLoadingDatabase,
    isError,
    error,
    refetch,
    isFetching: isFetchingDatabase
  } = useQuery({
    queryKey,
    queryFn: () => TransactionApiService.getTransactions(queryParams),
    enabled: enabled && (selectedCompany !== undefined),
    refetchInterval,
    staleTime,
    cacheTime,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Infinite query for cursor-based pagination (optional)
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['transactions-infinite', selectedCompany, queryParams],
    queryFn: ({ pageParam }) => TransactionApiService.getTransactionsCursor({
      ...queryParams,
      cursor: pageParam
    }),
    enabled: false, // Enable when needed for large datasets
    getNextPageParam: (lastPage) => lastPage.cursor,
    staleTime,
    cacheTime,
  });

  // Statistics query (loaded separately for performance)
  const {
    data: statistics,
    isLoading: isLoadingStats
  } = useQuery({
    queryKey: ['transaction-statistics', selectedCompany],
    queryFn: () => TransactionApiService.getTransactionStatistics(selectedCompany),
    enabled: enabled && (selectedCompany !== undefined),
    staleTime: 120000, // 2 minutes (less frequent updates)
    cacheTime: 300000, // 5 minutes
  });

  // Mutations
  const createTransactionMutation = useMutation({
    mutationFn: TransactionApiService.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-statistics'] });
    },
  });

  const createBulkTransactionsMutation = useMutation({
    mutationFn: TransactionApiService.createTransactionsBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-statistics'] });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionFormData> }) =>
      TransactionApiService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-statistics'] });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: TransactionApiService.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-statistics'] });
    },
  });

  const deleteBulkTransactionsMutation = useMutation({
    mutationFn: TransactionApiService.deleteTransactionsBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-statistics'] });
    },
  });

  const linkTransactionMutation = useMutation({
    mutationFn: ({ transactionId, entryId }: { transactionId: string; entryId: string }) =>
      TransactionApiService.linkTransaction(transactionId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const unlinkTransactionMutation = useMutation({
    mutationFn: TransactionApiService.unlinkTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  // Computed values - combine database and live crypto transactions
  const transactions = useMemo(() => {
    const databaseTransactions = transactionsData?.data || [];
    const liveTransactions = liveCryptoTransactions || [];
    
    // Combine all transactions first
    const allTransactions = [...databaseTransactions, ...liveTransactions];
    
    // Deduplicate by hash + currency + account combination across ALL transactions
    const deduplicatedTransactions = allTransactions.filter((transaction, index, array) => {
      const hash = transaction.reference;
      const currency = transaction.currency;
      const accountId = transaction.accountId;
      
      if (!hash) {
        // If no hash, keep the transaction (non-blockchain transactions)
        return true;
      }
      
      // For blockchain transactions, deduplicate by hash + currency + accountId + category + amount combination
      // This ensures fee transactions and main transactions are treated as separate entries
      // AND preserves multi-send transactions with same hash but different amounts
      const category = transaction.category;
      const amount = transaction.netAmount;
      const duplicateIndex = array.findIndex((t, i) => 
        i !== index &&
        t.reference === hash && 
        t.currency === currency &&
        t.accountId === accountId &&
        t.category === category && // Add category to distinguish fee transactions from main transactions
        t.netAmount === amount // Add amount to preserve multi-send transactions
      );
      
      if (duplicateIndex >= 0) {
        // Debug logging for fee transactions
        if (category === 'Fees & Charges' && process.env.NODE_ENV === 'development') {
          console.log('🔍 Fee transaction deduplication:', {
            currentId: transaction.id,
            currentAmount: transaction.netAmount,
            currentIsLive: transaction.id.toString().startsWith('live-'),
            duplicateId: array[duplicateIndex].id,
            duplicateAmount: array[duplicateIndex].netAmount,
            duplicateIsLive: array[duplicateIndex].id.toString().startsWith('live-'),
            hash: hash.substring(0, 10) + '...',
            category,
            decision: 'determining...'
          });
        }
        
        // Found a duplicate - prefer database transaction over live transaction
        const currentIsDatabase = !transaction.id.toString().startsWith('live-');
        const duplicateIsDatabase = !array[duplicateIndex].id.toString().startsWith('live-');
        
        // Special handling for fee transactions - prefer the one with non-zero amount
        if (category === 'Fees & Charges') {
          const currentAmount = Math.abs(transaction.netAmount || 0);
          const duplicateAmount = Math.abs(array[duplicateIndex].netAmount || 0);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Fee transaction amounts:', {
              currentAmount,
              duplicateAmount,
              preferCurrent: currentAmount > duplicateAmount
            });
          }
          
          // Prefer the transaction with the larger amount (non-zero fee)
          if (currentAmount > duplicateAmount) {
            return true; // Keep current
          } else if (duplicateAmount > currentAmount) {
            return false; // Keep duplicate
          }
        }
        
        // Default deduplication logic for non-fee transactions or when amounts are equal
        if (currentIsDatabase && !duplicateIsDatabase) {
          return true; // Keep current (database)
        } else if (!currentIsDatabase && duplicateIsDatabase) {
          return false; // Skip current (live), keep duplicate (database) 
        } else {
          // Both same type, keep first occurrence
          return index < duplicateIndex;
        }
      }
      
      return true; // No duplicate found, keep transaction
    });
    
    // Sort by date (most recent first)
    deduplicatedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Final safeguard: Force all IDs to be unique by adding suffix if duplicates detected
    const idCounts = new Map<string, number>();
    deduplicatedTransactions.forEach((transaction, index) => {
      const currentCount = idCounts.get(transaction.id) || 0;
      idCounts.set(transaction.id, currentCount + 1);
      
      if (currentCount > 0) {
        // This is a duplicate - force unique ID
        const newId = `${transaction.id}-duplicate-${currentCount}`;
        deduplicatedTransactions[index] = { ...transaction, id: newId };
        console.warn(`🔧 Fixed duplicate ID: ${transaction.id} -> ${newId}`);
      }
    });
    
    // Debug: Check for actual duplicate IDs in the final list
    const allIds = deduplicatedTransactions.map(t => t.id);
    const duplicateIds = allIds.filter((id, index) => allIds.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      console.error('🚨 DUPLICATE IDs DETECTED:', duplicateIds);
      console.error('🚨 Transactions with duplicate IDs:', 
        deduplicatedTransactions.filter(t => duplicateIds.includes(t.id)).map(t => ({
          id: t.id,
          hash: t.reference,
          currency: t.currency,
          amount: t.netAmount
        }))
      );
    }

    // Additional logging for deduplication debugging
    if (process.env.NODE_ENV === 'development') {
      const hashGroups = new Map();
      liveTransactions.forEach(t => {
        const key = `${t.reference}-${t.currency}`;
        if (!hashGroups.has(key)) {
          hashGroups.set(key, []);
        }
        hashGroups.get(key).push({
          id: t.id,
          walletId: t.accountId,
          amount: t.netAmount
        });
      });

      const duplicateHashes = Array.from(hashGroups.entries()).filter(([key, transactions]) => transactions.length > 1);
      if (duplicateHashes.length > 0) {
        console.warn('🔍 Found transactions with same hash before deduplication:', duplicateHashes);
      }
    }
    
    console.log('🔄 Combined transactions:', {
      database: databaseTransactions.length,
      liveCrypto: liveTransactions.length,
      combined: databaseTransactions.length + liveTransactions.length,
      afterDeduplication: deduplicatedTransactions.length,
      duplicatesRemoved: (databaseTransactions.length + liveTransactions.length) - deduplicatedTransactions.length,
      duplicateIdCount: duplicateIds.length
    });
    
    return deduplicatedTransactions;
  }, [transactionsData, liveCryptoTransactions]);

  const pagination = useMemo(() => 
    transactionsData?.pagination, 
    [transactionsData]
  );

  const hasTransactions = transactions.length > 0;

  // Group transactions by account/wallet AND currency
  const transactionsByAccount = useMemo(() => {
    const accountGroups: { [key: string]: { 
      accountId: string;
      accountType: string;
      accountName: string;
      currency: string;
      transactions: TransactionItem[];
      totalIncoming: number;
      totalOutgoing: number;
      netAmount: number;
    }} = {};

    transactions.forEach(transaction => {
      // Group by account AND currency to avoid mixing different tokens
      const accountKey = `${transaction.accountType}-${transaction.accountId}-${transaction.currency}`;
      
      if (!accountGroups[accountKey]) {
        // Determine account name based on transaction details
        let accountName = 'Unknown Account';
        if (transaction.accountType === 'wallet') {
          // Try to find the wallet in cryptoWallets
          const originalWalletId = transaction.accountId.split('-')[0]; // Get base wallet ID
          const matchingWallet = cryptoWallets?.find(w => 
            w.originalId === originalWalletId || 
            w.id === transaction.accountId ||
            w.id === originalWalletId
          );
          
          if (matchingWallet) {
            // Extract base wallet name without currency suffix
            const baseWalletName = matchingWallet.walletName.replace(/\s*\([^)]*\)$/, '');
            accountName = `${baseWalletName} (${transaction.currency})`;
          } else if (transaction.id.startsWith('live-')) {
            // Fallback for live transactions without matching wallet
            accountName = `${transaction.currency} Wallet`;
          } else {
            accountName = `Wallet (${transaction.currency})`;
          }
        } else {
          accountName = `Bank Account ${transaction.accountId}`;
        }

        accountGroups[accountKey] = {
          accountId: transaction.accountId,
          accountType: transaction.accountType,
          accountName: accountName,
          currency: transaction.currency,
          transactions: [],
          totalIncoming: 0,
          totalOutgoing: 0,
          netAmount: 0
        };
      }
      
      accountGroups[accountKey].transactions.push(transaction);
      
      // Update totals - now safe because we're only summing same currency
      if (transaction.incomingAmount > 0) {
        accountGroups[accountKey].totalIncoming += transaction.incomingAmount;
      }
      if (transaction.outgoingAmount > 0) {
        accountGroups[accountKey].totalOutgoing += transaction.outgoingAmount;
      }
      accountGroups[accountKey].netAmount += transaction.netAmount;
    });

    // Sort each account's transactions by date (most recent first)
    Object.values(accountGroups).forEach(group => {
      group.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return Object.values(accountGroups);
  }, [transactions, cryptoWallets]);

  // Group transactions (legacy - kept for compatibility)
  const groupedTransactions = useMemo(() => {
    if (grouping.groupBy === 'none' || !grouping.groupedView) {
      return [{ key: 'all', name: 'All Transactions', transactions }];
    }

    const groups: { [key: string]: TransactionItem[] } = {};

    transactions.forEach(transaction => {
      let groupKey = '';
      
      switch (grouping.groupBy) {
        case 'date':
          const date = new Date(transaction.date);
          groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'category':
          groupKey = transaction.category;
          break;
        case 'account':
          groupKey = `${transaction.accountType}-${transaction.accountId}`;
          break;
        case 'status':
          groupKey = transaction.status;
          break;
        case 'currency':
          groupKey = transaction.currency;
          break;
        default:
          groupKey = 'all';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(transaction);
    });

    return Object.entries(groups).map(([key, transactions]) => ({
      key,
      name: formatGroupName(key, grouping.groupBy),
      transactions
    }));
  }, [transactions, grouping]);

  // Helper function to format group names
  const formatGroupName = (key: string, groupBy: string): string => {
    switch (groupBy) {
      case 'date':
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      case 'status':
        return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
      case 'account':
        return key; // Could be enhanced to show account names
      default:
        return key;
    }
  };

  // Filter actions
  const updateFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      status: 'all',
      reconciliationStatus: 'all',
      approvalStatus: 'all',
      accountId: 'all',
      accountType: 'all',
      currency: 'all',
      dateRange: 'all',
      dateFrom: '',
      dateTo: '',
      sortField: 'date',
      sortDirection: 'desc',
    });
  }, []);

  // Grouping actions
  const updateGrouping = useCallback((newGrouping: Partial<TransactionGrouping>) => {
    setGrouping(prev => ({ ...prev, ...newGrouping }));
  }, []);

  // UI State actions
  const toggleTransactionSelection = useCallback((transactionId: string) => {
    setUIState(prev => {
      const newSelected = new Set(prev.selectedTransactions);
      if (newSelected.has(transactionId)) {
        newSelected.delete(transactionId);
      } else {
        newSelected.add(transactionId);
      }
      return { ...prev, selectedTransactions: newSelected };
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setUIState(prev => {
      const allTransactionIds = transactions.map(t => t.id);
      const allSelected = allTransactionIds.every(id => prev.selectedTransactions.has(id));
      
      return {
        ...prev,
        selectedTransactions: allSelected ? new Set() : new Set(allTransactionIds)
      };
    });
  }, [transactions]);

  const toggleGroupExpansion = useCallback((groupKey: string) => {
    setUIState(prev => {
      const newExpanded = new Set(prev.expandedGroups);
      if (newExpanded.has(groupKey)) {
        newExpanded.delete(groupKey);
      } else {
        newExpanded.add(groupKey);
      }
      return { ...prev, expandedGroups: newExpanded };
    });
  }, []);

  const toggleTransactionExpansion = useCallback((transactionId: string) => {
    setUIState(prev => {
      const newExpanded = new Set(prev.expandedTransactions);
      if (newExpanded.has(transactionId)) {
        newExpanded.delete(transactionId);
      } else {
        newExpanded.add(transactionId);
      }
      return { ...prev, expandedTransactions: newExpanded };
    });
  }, []);

  // CRUD Operations
  const createTransaction = useCallback(async (data: TransactionFormData) => {
    return createTransactionMutation.mutateAsync(data);
  }, [createTransactionMutation]);

  const createBulkTransactions = useCallback(async (transactions: TransactionFormData[]) => {
    return createBulkTransactionsMutation.mutateAsync(transactions);
  }, [createBulkTransactionsMutation]);

  const updateTransaction = useCallback(async (id: string, data: Partial<TransactionFormData>) => {
    return updateTransactionMutation.mutateAsync({ id, data });
  }, [updateTransactionMutation]);

  const deleteTransaction = useCallback(async (id: string) => {
    return deleteTransactionMutation.mutateAsync(id);
  }, [deleteTransactionMutation]);

  const deleteBulkTransactions = useCallback(async (ids: string[]) => {
    return deleteBulkTransactionsMutation.mutateAsync(ids);
  }, [deleteBulkTransactionsMutation]);

  const linkTransaction = useCallback(async (transactionId: string, entryId: string) => {
    return linkTransactionMutation.mutateAsync({ transactionId, entryId });
  }, [linkTransactionMutation]);

  const unlinkTransaction = useCallback(async (transactionId: string) => {
    return unlinkTransactionMutation.mutateAsync(transactionId);
  }, [unlinkTransactionMutation]);

  // Bulk operations
  const addBulkTransactionRow = useCallback(() => {
    setBulkTransactions(prev => [...prev, {}]);
  }, []);

  const removeBulkTransactionRow = useCallback((index: number) => {
    setBulkTransactions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateBulkTransaction = useCallback((index: number, data: Partial<TransactionFormData>) => {
    setBulkTransactions(prev => 
      prev.map((transaction, i) => 
        i === index ? { ...transaction, ...data } : transaction
      )
    );
  }, []);

  const handleBulkCreate = useCallback(async () => {
    const validTransactions = bulkTransactions.filter(t => 
      t.paidBy && t.paidTo && t.netAmount && t.currency && t.accountId
    ) as TransactionFormData[];

    if (validTransactions.length === 0) {
      throw new Error('No valid transactions to create');
    }

    await createBulkTransactions(validTransactions);
    setBulkTransactions([]);
    setBulkSelectedAccountId('');
    setUIState(prev => ({ ...prev, showBulkAddDialog: false }));
  }, [bulkTransactions, createBulkTransactions]);

  // Delete confirmations
  const confirmBulkDelete = useCallback(async () => {
    const selectedIds = Array.from(uiState.selectedTransactions);
    if (selectedIds.length > 0) {
      await deleteBulkTransactions(selectedIds);
      setUIState(prev => ({
        ...prev,
        selectedTransactions: new Set(),
        showDeleteConfirmDialog: false
      }));
    }
  }, [uiState.selectedTransactions, deleteBulkTransactions]);

  // Page title and description
  const pageTitle = useMemo(() => {
    if (selectedCompany === 'all') {
      return 'All Transactions';
    }
    const company = companies.find(c => c.id === selectedCompany);
    return company ? `${company.tradingName} - Transactions` : 'Transactions';
  }, [selectedCompany, companies]);

  const pageDescription = useMemo(() => {
    if (selectedCompany === 'all') {
      return 'View and manage transactions across all companies';
    }
    const company = companies.find(c => c.id === selectedCompany);
    return company ? `Financial transactions for ${company.tradingName}` : 'View and manage your financial transactions';
  }, [selectedCompany, companies]);

  // Comprehensive loading states
  const isLoading = isLoadingDatabase || isLoadingWallets || isLoadingLiveCrypto;
  const isFetching = isFetchingDatabase || isLoadingLiveCrypto;
  const isCreating = createTransactionMutation.isPending || createBulkTransactionsMutation.isPending;
  const isUpdating = updateTransactionMutation.isPending;
  const isDeleting = deleteTransactionMutation.isPending || deleteBulkTransactionsMutation.isPending;
  const isLinking = linkTransactionMutation.isPending || unlinkTransactionMutation.isPending;
  
  // Combine errors from different sources
  const combinedError = useMemo(() => {
    if (error) return error;
    if (isLiveCryptoError && liveCryptoError) {
      return new Error(`Live crypto data: ${liveCryptoError.message}`);
    }
    return null;
  }, [error, isLiveCryptoError, liveCryptoError]);

  // Period-specific helper functions
  const updatePeriodFilter = useCallback((newPeriod: PeriodPreset, customRange?: DateRange) => {
    setFilters(prev => ({
      ...prev,
      dateRange: newPeriod,
      customDateFrom: newPeriod === 'custom' && customRange ? customRange.startDate : null,
      customDateTo: newPeriod === 'custom' && customRange ? customRange.endDate : null,
      dateFrom: '', // Clear legacy string dates
      dateTo: ''    // Clear legacy string dates
    }));
  }, []);

  const validateCustomDateRange = useCallback((startDate: Date | null, endDate: Date | null): boolean => {
    return PeriodFilterService.validateDateRange(startDate, endDate);
  }, []);

  const getCurrentPeriodLabel = useCallback((): string => {
    if (filters.dateRange === 'custom' && filters.customDateFrom && filters.customDateTo) {
      return PeriodFilterService.formatDateRangeForDisplay(filters.dateRange, {
        startDate: filters.customDateFrom,
        endDate: filters.customDateTo
      });
    }
    return PeriodFilterService.getPeriodLabel(filters.dateRange);
  }, [filters.dateRange, filters.customDateFrom, filters.customDateTo]);

  const getAvailablePeriods = useCallback(() => {
    return PeriodFilterService.getSuggestedPeriods();
  }, []);

  return {
    // Data
    transactions,
    transactionsByAccount,
    groupedTransactions,
    statistics,
    pagination,
    hasTransactions,
    
    // Loading states
    isLoading,
    isError: isError || isLiveCryptoError,
    error: combinedError,
    isFetching,
    isLoadingStats,
    isLoadingWallets,
    isLoadingLiveCrypto,
    isCreating,
    isUpdating,
    isDeleting,
    isLinking,
    
    // Crypto data
    cryptoWallets: cryptoWallets || [],
    liveCryptoTransactions: liveCryptoTransactions || [],
    
    // State
    filters,
    grouping,
    uiState,
    bulkTransactions,
    bulkSelectedAccountId,
    
    // Filter actions
    updateFilters,
    resetFilters,
    
    // Grouping actions
    updateGrouping,
    
    // UI actions
    toggleTransactionSelection,
    toggleSelectAll,
    toggleGroupExpansion,
    toggleTransactionExpansion,
    setUIState,
    
    // CRUD operations
    createTransaction,
    createBulkTransactions,
    updateTransaction,
    deleteTransaction,
    deleteBulkTransactions,
    linkTransaction,
    unlinkTransaction,
    
    // Bulk operations
    setBulkTransactions,
    setBulkSelectedAccountId,
    addBulkTransactionRow,
    removeBulkTransactionRow,
    updateBulkTransaction,
    handleBulkCreate,
    confirmBulkDelete,
    
    // Infinite query (for large datasets)
    infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    
    // Utility
    refetch,
    pageTitle,
    pageDescription,
    
    // Period filtering utilities
    updatePeriodFilter,
    validateCustomDateRange,
    getCurrentPeriodLabel,
    getAvailablePeriods,
  };
}