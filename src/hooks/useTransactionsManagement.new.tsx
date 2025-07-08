import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDebouncedSearch } from './useDebounce'
import {
  transactionsApiService,
  TransactionQueryParams,
  TransactionFormData,
  Transaction,
  TransactionStatistics
} from '@/services/api/transactionsApiService'
import { getLocalDateString } from '@/utils'

const TRANSACTIONS_QUERY_KEY = 'transactions'
const TRANSACTION_STATISTICS_QUERY_KEY = 'transaction-statistics'

export interface TransactionsManagementHook {
  // Data with loading states
  transactions: Transaction[]
  isTransactionsLoading: boolean
  isTransactionsError: boolean
  transactionsError: Error | null
  
  statistics: TransactionStatistics | undefined
  isStatisticsLoading: boolean
  
  // Pagination
  pagination: {
    skip: number
    take: number
    total: number
    hasMore: boolean
  }
  
  // Search
  searchValue: string
  debouncedSearchValue: string
  isSearching: boolean
  setSearchValue: (value: string) => void
  
  // Filters
  filters: {
    companyId: number | 'all'
    accountId?: string
    accountType?: 'BANK' | 'WALLET' | 'CASH' | 'CREDIT_CARD'
    period: 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom'
    customDateRange: { start: string; end: string }
    category?: string
    subcategory?: string
    status?: 'PENDING' | 'CLEARED' | 'FAILED' | 'CANCELLED'
    reconciliationStatus?: 'UNRECONCILED' | 'RECONCILED' | 'DISPUTED'
    currency?: string
    viewFilter: 'all' | 'incoming' | 'outgoing'
  }
  
  // Sorting
  sorting: {
    sortField: 'date' | 'amount' | 'paidBy' | 'paidTo' | 'category' | 'account'
    sortDirection: 'asc' | 'desc'
  }
  
  // UI State
  showTransactionDialog: boolean
  showBulkAddDialog: boolean
  showDeleteConfirmDialog: boolean
  editingTransaction: Transaction | null
  selectedTransactions: Set<string>
  expandedTransactions: Set<string>
  
  // Form State
  transactionForm: TransactionFormData
  bulkTransactions: Array<Partial<TransactionFormData>>
  bulkAccountId: string
  
  // Actions
  setShowTransactionDialog: (show: boolean) => void
  setShowBulkAddDialog: (show: boolean) => void
  setShowDeleteConfirmDialog: (show: boolean) => void
  setEditingTransaction: (transaction: Transaction | null) => void
  updateFilters: (newFilters: Partial<typeof filters>) => void
  updateSorting: (newSorting: Partial<typeof sorting>) => void
  
  // Pagination
  loadMore: () => void
  resetPagination: () => void
  
  // Form Handlers
  updateTransactionForm: (field: string, value: any) => void
  resetTransactionForm: () => void
  updateBulkTransaction: (index: number, field: string, value: any) => void
  addBulkTransactionRow: () => void
  removeBulkTransactionRow: (index: number) => void
  resetBulkForm: () => void
  
  // CRUD Operations
  createTransaction: () => Promise<void>
  updateTransaction: () => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  
  // Bulk Operations
  bulkCreateTransactions: () => Promise<void>
  bulkDeleteTransactions: (ids: string[]) => Promise<void>
  bulkCategorizeTransactions: (ids: string[], category: string, subcategory?: string) => Promise<void>
  bulkReconcileTransactions: (ids: string[], status: string, statementDate?: string, reference?: string) => Promise<void>
  bulkApproveTransactions: (ids: string[], status: string) => Promise<void>
  
  // Selection Management
  toggleTransactionSelection: (transactionId: string) => void
  toggleSelectAll: () => void
  clearSelection: () => void
  
  // UI Actions
  toggleTransactionExpansion: (transactionId: string) => void
  toggleAllExpansion: () => void
  
  // Utility
  formatCurrency: (amount: number, currency?: string) => string
  getAccountName: (transaction: Transaction) => string
  getCashFlowDirection: (transaction: Transaction) => 'incoming' | 'outgoing' | 'neutral'
}

const initialTransactionForm: TransactionFormData = {
  companyId: 0,
  date: getLocalDateString(),
  paidBy: '',
  paidTo: '',
  netAmount: 0,
  currency: 'USD',
  accountId: '',
  accountType: 'BANK',
  status: 'CLEARED',
  reconciliationStatus: 'UNRECONCILED',
  approvalStatus: 'APPROVED',
  isRecurring: false,
}

const initialBulkTransaction: Partial<TransactionFormData> = {
  date: getLocalDateString(),
  currency: 'USD',
  netAmount: 0,
  accountType: 'BANK',
  status: 'CLEARED',
}

export function useTransactionsManagement(
  selectedCompany: number | 'all' = 'all'
): TransactionsManagementHook {
  const queryClient = useQueryClient()
  
  // Search with debouncing
  const { searchValue, debouncedSearchValue, isSearching, setSearchValue } = useDebouncedSearch('', 300)
  
  // UI State
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)
  const [showBulkAddDialog, setShowBulkAddDialog] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set())
  
  // Form State
  const [transactionForm, setTransactionForm] = useState<TransactionFormData>(initialTransactionForm)
  const [bulkTransactions, setBulkTransactions] = useState<Array<Partial<TransactionFormData>>>([initialBulkTransaction])
  const [bulkAccountId, setBulkAccountId] = useState('')
  
  // Filters and Sorting
  const [filters, setFilters] = useState({
    companyId: selectedCompany,
    period: 'thisMonth' as const,
    customDateRange: { start: '', end: '' },
    viewFilter: 'all' as const,
  })
  const [sorting, setSorting] = useState({
    sortField: 'date' as const,
    sortDirection: 'desc' as const,
  })
  const [pagination, setPagination] = useState({ skip: 0, take: 20 })
  
  // Build query parameters
  const queryParams: TransactionQueryParams = useMemo(() => {
    const params: TransactionQueryParams = {
      companyId: typeof filters.companyId === 'number' ? filters.companyId : 0,
      ...pagination,
      ...sorting,
      period: filters.period,
    }
    
    // Date range for custom period
    if (filters.period === 'custom') {
      if (filters.customDateRange.start) params.dateFrom = filters.customDateRange.start
      if (filters.customDateRange.end) params.dateTo = filters.customDateRange.end
    }
    
    // Optional filters
    if (filters.accountId) params.accountId = filters.accountId
    if (filters.accountType) params.accountType = filters.accountType
    if (filters.category) params.category = filters.category
    if (filters.subcategory) params.subcategory = filters.subcategory
    if (filters.status) params.status = filters.status
    if (filters.reconciliationStatus) params.reconciliationStatus = filters.reconciliationStatus
    if (filters.currency) params.currency = filters.currency
    if (debouncedSearchValue) params.search = debouncedSearchValue
    
    return params
  }, [filters, pagination, sorting, debouncedSearchValue])
  
  // Transactions Query
  const {
    data: transactionsResponse,
    isLoading: isTransactionsLoading,
    isError: isTransactionsError,
    error: transactionsError,
  } = useQuery({
    queryKey: [TRANSACTIONS_QUERY_KEY, queryParams],
    queryFn: () => transactionsApiService.getTransactions(queryParams),
    enabled: typeof filters.companyId === 'number',
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
  
  // Statistics Query
  const { data: statistics, isLoading: isStatisticsLoading } = useQuery({
    queryKey: [TRANSACTION_STATISTICS_QUERY_KEY, filters.companyId, filters.period],
    queryFn: () => transactionsApiService.getStatistics(
      typeof filters.companyId === 'number' ? filters.companyId : 0,
      { 
        period: filters.period,
        ...(filters.period === 'custom' && {
          dateFrom: filters.customDateRange.start,
          dateTo: filters.customDateRange.end,
        })
      }
    ),
    enabled: typeof filters.companyId === 'number',
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Extract data from responses
  const transactions = useMemo(() => {
    if (!transactionsResponse?.data) return []
    
    // Apply view filter (client-side for better UX)
    let filtered = transactionsResponse.data
    
    if (filters.viewFilter === 'incoming') {
      filtered = filtered.filter(t => (t.incomingAmount || 0) > 0)
    } else if (filters.viewFilter === 'outgoing') {
      filtered = filtered.filter(t => (t.outgoingAmount || 0) > 0)
    }
    
    return filtered
  }, [transactionsResponse?.data, filters.viewFilter])
  
  const paginationData = transactionsResponse?.pagination || { skip: 0, take: 20, total: 0, hasMore: false }
  
  // Mutations
  const createTransactionMutation = useMutation({
    mutationFn: (data: TransactionFormData) => transactionsApiService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [TRANSACTION_STATISTICS_QUERY_KEY] })
      toast.success('Transaction created successfully')
      setShowTransactionDialog(false)
      resetTransactionForm()
    },
    onError: (error: Error) => {
      toast.error(`Failed to create transaction: ${error.message}`)
    },
  })
  
  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionFormData> }) =>
      transactionsApiService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [TRANSACTION_STATISTICS_QUERY_KEY] })
      toast.success('Transaction updated successfully')
      setEditingTransaction(null)
      setShowTransactionDialog(false)
      resetTransactionForm()
    },
    onError: (error: Error) => {
      toast.error(`Failed to update transaction: ${error.message}`)
    },
  })
  
  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) => transactionsApiService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [TRANSACTION_STATISTICS_QUERY_KEY] })
      toast.success('Transaction deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete transaction: ${error.message}`)
    },
  })
  
  // Action handlers
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination({ skip: 0, take: 20 }) // Reset pagination when filters change
  }, [])
  
  const updateSorting = useCallback((newSorting: Partial<typeof sorting>) => {
    setSorting(prev => ({ ...prev, ...newSorting }))
    setPagination({ skip: 0, take: 20 }) // Reset pagination when sorting changes
  }, [])
  
  const loadMore = useCallback(() => {
    if (paginationData.hasMore) {
      setPagination(prev => ({ ...prev, skip: prev.skip + prev.take }))
    }
  }, [paginationData.hasMore])
  
  const resetPagination = useCallback(() => {
    setPagination({ skip: 0, take: 20 })
  }, [])
  
  const updateTransactionForm = useCallback((field: string, value: any) => {
    setTransactionForm(prev => ({ ...prev, [field]: value }))
  }, [])
  
  const resetTransactionForm = useCallback(() => {
    setTransactionForm(initialTransactionForm)
  }, [])
  
  const updateBulkTransaction = useCallback((index: number, field: string, value: any) => {
    setBulkTransactions(prev => 
      prev.map((item, i) => i === index ? { ...item, [field]: value } : item)
    )
  }, [])
  
  const addBulkTransactionRow = useCallback(() => {
    setBulkTransactions(prev => [...prev, { ...initialBulkTransaction }])
  }, [])
  
  const removeBulkTransactionRow = useCallback((index: number) => {
    setBulkTransactions(prev => prev.filter((_, i) => i !== index))
  }, [])
  
  const resetBulkForm = useCallback(() => {
    setBulkTransactions([initialBulkTransaction])
    setBulkAccountId('')
  }, [])
  
  // CRUD Operations
  const createTransaction = useCallback(async () => {
    createTransactionMutation.mutate(transactionForm)
  }, [transactionForm, createTransactionMutation])
  
  const updateTransaction = useCallback(async () => {
    if (!editingTransaction) return
    updateTransactionMutation.mutate({ id: editingTransaction.id, data: transactionForm })
  }, [editingTransaction, transactionForm, updateTransactionMutation])
  
  const deleteTransaction = useCallback(async (id: string) => {
    deleteTransactionMutation.mutate(id)
  }, [deleteTransactionMutation])
  
  // Bulk Operations
  const bulkCreateTransactions = useCallback(async () => {
    const validTransactions = bulkTransactions.filter(t => 
      t.paidBy && t.paidTo && t.netAmount && (t.netAmount > 0)
    ) as TransactionFormData[]
    
    if (validTransactions.length === 0) {
      toast.error('No valid transactions to create')
      return
    }
    
    // Add common fields to all transactions
    const completedTransactions = validTransactions.map(t => ({
      ...t,
      companyId: typeof filters.companyId === 'number' ? filters.companyId : 0,
      accountId: bulkAccountId,
    }))
    
    try {
      await transactionsApiService.bulkCreateTransactions(completedTransactions)
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [TRANSACTION_STATISTICS_QUERY_KEY] })
      toast.success(`Created ${completedTransactions.length} transactions`)
      setShowBulkAddDialog(false)
      resetBulkForm()
    } catch (error) {
      toast.error(`Failed to create transactions: ${error}`)
    }
  }, [bulkTransactions, bulkAccountId, filters.companyId, queryClient])
  
  const bulkDeleteTransactions = useCallback(async (ids: string[]) => {
    try {
      await transactionsApiService.bulkDeleteTransactions(ids)
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [TRANSACTION_STATISTICS_QUERY_KEY] })
      toast.success(`Deleted ${ids.length} transactions`)
      setSelectedTransactions(new Set())
    } catch (error) {
      toast.error(`Failed to delete transactions: ${error}`)
    }
  }, [queryClient])
  
  const bulkCategorizeTransactions = useCallback(async (ids: string[], category: string, subcategory?: string) => {
    try {
      await transactionsApiService.bulkCategorizeTransactions(ids, category, subcategory)
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] })
      toast.success(`Categorized ${ids.length} transactions`)
    } catch (error) {
      toast.error(`Failed to categorize transactions: ${error}`)
    }
  }, [queryClient])
  
  const bulkReconcileTransactions = useCallback(async (ids: string[], status: string, statementDate?: string, reference?: string) => {
    try {
      await transactionsApiService.bulkReconcileTransactions(ids, status, statementDate, reference)
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] })
      toast.success(`Updated reconciliation for ${ids.length} transactions`)
    } catch (error) {
      toast.error(`Failed to reconcile transactions: ${error}`)
    }
  }, [queryClient])
  
  const bulkApproveTransactions = useCallback(async (ids: string[], status: string) => {
    try {
      await transactionsApiService.bulkApproveTransactions(ids, status)
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] })
      toast.success(`Updated approval for ${ids.length} transactions`)
    } catch (error) {
      toast.error(`Failed to approve transactions: ${error}`)
    }
  }, [queryClient])
  
  // Selection Management
  const toggleTransactionSelection = useCallback((transactionId: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId)
      } else {
        newSet.add(transactionId)
      }
      return newSet
    })
  }, [])
  
  const toggleSelectAll = useCallback(() => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)))
    }
  }, [transactions, selectedTransactions.size])
  
  const clearSelection = useCallback(() => {
    setSelectedTransactions(new Set())
  }, [])
  
  // UI Actions
  const toggleTransactionExpansion = useCallback((transactionId: string) => {
    setExpandedTransactions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId)
      } else {
        newSet.add(transactionId)
      }
      return newSet
    })
  }, [])
  
  const toggleAllExpansion = useCallback(() => {
    if (expandedTransactions.size === transactions.length) {
      setExpandedTransactions(new Set())
    } else {
      setExpandedTransactions(new Set(transactions.map(t => t.id)))
    }
  }, [transactions, expandedTransactions.size])
  
  // Utility functions
  const formatCurrency = useCallback((amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }, [])
  
  const getAccountName = useCallback((transaction: Transaction) => {
    if (transaction.companyAccount) {
      return transaction.companyAccount.name
    } else if (transaction.bankAccount) {
      return transaction.bankAccount.accountName
    } else if (transaction.digitalWallet) {
      return transaction.digitalWallet.walletName
    }
    return 'Unknown Account'
  }, [])
  
  const getCashFlowDirection = useCallback((transaction: Transaction) => {
    if ((transaction.incomingAmount || 0) > 0) return 'incoming'
    if ((transaction.outgoingAmount || 0) > 0) return 'outgoing'
    return 'neutral'
  }, [])
  
  return {
    // Data with loading states
    transactions,
    isTransactionsLoading,
    isTransactionsError,
    transactionsError: transactionsError as Error | null,
    
    statistics,
    isStatisticsLoading,
    
    // Pagination
    pagination: paginationData,
    
    // Search
    searchValue,
    debouncedSearchValue,
    isSearching,
    setSearchValue,
    
    // Filters
    filters,
    
    // Sorting
    sorting,
    
    // UI State
    showTransactionDialog,
    showBulkAddDialog,
    showDeleteConfirmDialog,
    editingTransaction,
    selectedTransactions,
    expandedTransactions,
    
    // Form State
    transactionForm,
    bulkTransactions,
    bulkAccountId,
    
    // Actions
    setShowTransactionDialog,
    setShowBulkAddDialog,
    setShowDeleteConfirmDialog,
    setEditingTransaction,
    updateFilters,
    updateSorting,
    
    // Pagination
    loadMore,
    resetPagination,
    
    // Form Handlers
    updateTransactionForm,
    resetTransactionForm,
    updateBulkTransaction,
    addBulkTransactionRow,
    removeBulkTransactionRow,
    resetBulkForm,
    
    // CRUD Operations
    createTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Bulk Operations
    bulkCreateTransactions,
    bulkDeleteTransactions,
    bulkCategorizeTransactions,
    bulkReconcileTransactions,
    bulkApproveTransactions,
    
    // Selection Management
    toggleTransactionSelection,
    toggleSelectAll,
    clearSelection,
    
    // UI Actions
    toggleTransactionExpansion,
    toggleAllExpansion,
    
    // Utility
    formatCurrency,
    getAccountName,
    getCashFlowDirection,
  }
}