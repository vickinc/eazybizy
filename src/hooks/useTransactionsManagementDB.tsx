"use client";

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { TransactionApiService, TransactionQueryParams, TransactionFormData, TransactionItem } from '@/services/api/transactionApiService';
import type { Company } from '@/types/company.types';

interface UseTransactionsManagementDBOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  cacheTime?: number;
}

export interface TransactionFilters {
  searchTerm: string;
  status: 'all' | 'pending' | 'cleared' | 'cancelled';
  reconciliationStatus: 'all' | 'unreconciled' | 'reconciled' | 'auto_reconciled';
  approvalStatus: 'all' | 'pending' | 'approved' | 'rejected';
  accountId: string;
  accountType: 'all' | 'bank' | 'wallet';
  currency: string;
  dateRange: 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom';
  dateFrom: string;
  dateTo: string;
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
    dateRange: 'thisMonth',
    dateFrom: '',
    dateTo: '',
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

  // Build query parameters
  const queryParams = useMemo((): TransactionQueryParams => ({
    companyId: selectedCompany,
    searchTerm: filters.searchTerm || undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    reconciliationStatus: filters.reconciliationStatus !== 'all' ? filters.reconciliationStatus : undefined,
    approvalStatus: filters.approvalStatus !== 'all' ? filters.approvalStatus : undefined,
    accountId: filters.accountId !== 'all' ? filters.accountId : undefined,
    accountType: filters.accountType !== 'all' ? filters.accountType : undefined,
    currency: filters.currency !== 'all' ? filters.currency : undefined,
    dateRange: filters.dateRange !== 'custom' ? filters.dateRange : undefined,
    dateFrom: filters.dateRange === 'custom' && filters.dateFrom ? filters.dateFrom : undefined,
    dateTo: filters.dateRange === 'custom' && filters.dateTo ? filters.dateTo : undefined,
    sortField: filters.sortField,
    sortDirection: filters.sortDirection,
    take: 20, // Page size
  }), [selectedCompany, filters]);

  // Query key for caching
  const queryKey = useMemo(() => [
    'transactions',
    {
      company: selectedCompany,
      ...queryParams
    }
  ], [selectedCompany, queryParams]);

  // Main transactions query
  const {
    data: transactionsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
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

  // Computed values
  const transactions = useMemo(() => 
    transactionsData?.data || [], 
    [transactionsData]
  );

  const pagination = useMemo(() => 
    transactionsData?.pagination, 
    [transactionsData]
  );

  const hasTransactions = transactions.length > 0;

  // Group transactions
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
      dateRange: 'thisMonth',
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

  // Loading states
  const isCreating = createTransactionMutation.isPending || createBulkTransactionsMutation.isPending;
  const isUpdating = updateTransactionMutation.isPending;
  const isDeleting = deleteTransactionMutation.isPending || deleteBulkTransactionsMutation.isPending;
  const isLinking = linkTransactionMutation.isPending || unlinkTransactionMutation.isPending;

  return {
    // Data
    transactions,
    groupedTransactions,
    statistics,
    pagination,
    hasTransactions,
    
    // Loading states
    isLoading,
    isError,
    error,
    isFetching,
    isLoadingStats,
    isCreating,
    isUpdating,
    isDeleting,
    isLinking,
    
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
  };
}