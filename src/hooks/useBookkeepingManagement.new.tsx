import React, { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDebouncedSearch } from './useDebounce'
import { 
  BookkeepingEntry, 
  CompanyAccount,
  Transaction,
  FinancialSummary,
  PeriodFilter,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  ExpenseBreakdownItem
} from '@/types/bookkeeping.types'
import { Company } from '@/types/core'
import { 
  bookkeepingApiService,
  BookkeepingQueryParams,
  BookkeepingEntryFormData,
  BookkeepingStatistics 
} from '@/services/api/bookkeepingApiService'
import { getLocalDateString } from '@/utils'

const BOOKKEEPING_ENTRIES_QUERY_KEY = 'bookkeeping-entries'
const BOOKKEEPING_ACCOUNTS_QUERY_KEY = 'bookkeeping-accounts'
const BOOKKEEPING_TRANSACTIONS_QUERY_KEY = 'bookkeeping-transactions'
const BOOKKEEPING_STATISTICS_QUERY_KEY = 'bookkeeping-statistics'

// Compatibility types for old hook interface
export interface EnrichedBookkeepingEntry extends BookkeepingEntry {
  company?: Company
  accountsPayable: number
}

export interface ExpenseBreakdownWithPercentage extends ExpenseBreakdownItem {
  percentage: number
}

export interface ExtendedFinancialSummary extends FinancialSummary {
  income: number // Map from revenue
  actualCogsPaid: number
  projectedNetProfit: number
  profitMargin: string
}

export interface BookkeepingManagementHook {
  // Data with loading states
  entries: BookkeepingEntry[]
  isEntriesLoading: boolean
  isEntriesError: boolean
  entriesError: Error | null
  
  accounts: CompanyAccount[]
  isAccountsLoading: boolean
  
  transactions: Transaction[]
  isTransactionsLoading: boolean
  
  statistics: BookkeepingStatistics | undefined
  isStatisticsLoading: boolean
  
  // Compatibility layer for old hook interface
  filteredEntries: BookkeepingEntry[]
  enrichedEntries: EnrichedBookkeepingEntry[]
  financialSummary: ExtendedFinancialSummary
  expenseBreakdown: ExpenseBreakdownWithPercentage[]
  isLoaded: boolean
  selectedPeriod: PeriodFilter
  activeCompanies: Company[]
  availableInvoices: any[] // TODO: Add proper type
  entryFormData: BookkeepingEntryFormData
  showInvoiceSelect: boolean
  isAllExpanded: boolean
  
  // Compatibility actions
  setSelectedPeriod: (period: PeriodFilter) => void
  setShowInvoiceSelect: (show: boolean) => void
  handleEntryInputChange: (name: string, value: string) => void
  handleEntrySubmit: (e: React.FormEvent) => void
  handleEditEntry: (entry: BookkeepingEntry) => void
  handleDeleteEntry: (id: string) => void
  handleDialogCancel: () => void
  toggleEntryExpansion: (entryId: string) => void
  toggleAllEntriesExpansion: () => void
  handleInvoiceReferenceChange: (value: string) => void
  
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
    type?: 'INCOME' | 'EXPENSE'
    category?: string
    period: PeriodFilter
    accountId?: string
  }
  
  // UI State
  showEntryDialog: boolean
  showAccountDialog: boolean
  editingEntry: BookkeepingEntry | null
  editingAccount: CompanyAccount | null
  expandedEntries: Set<string>
  
  // Form State
  entryForm: BookkeepingEntryFormData
  accountForm: {
    companyId: number
    type: string
    name: string
    accountNumber?: string
    currency: string
    startingBalance?: number
  }
  
  // Actions
  setShowEntryDialog: (show: boolean) => void
  setShowAccountDialog: (show: boolean) => void
  setEditingEntry: (entry: BookkeepingEntry | null) => void
  setEditingAccount: (account: CompanyAccount | null) => void
  updateFilters: (newFilters: Partial<typeof filters>) => void
  
  // Pagination
  loadMore: () => void
  resetPagination: () => void
  
  // Form Handlers
  updateEntryForm: (field: string, value: any) => void
  updateAccountForm: (field: string, value: any) => void
  resetEntryForm: () => void
  resetAccountForm: () => void
  
  // CRUD Operations
  createEntry: () => Promise<void>
  updateEntry: () => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  
  createAccount: () => Promise<void>
  updateAccount: () => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  
  // Bulk Operations
  bulkDeleteEntries: (ids: string[]) => Promise<void>
  bulkUpdateCategory: (ids: string[], category: string) => Promise<void>
  
  // UI Actions
  toggleEntryExpansion: (entryId: string) => void
  toggleAllExpansion: () => void
  
  // Utility
  getAvailableCategories: (type: 'INCOME' | 'EXPENSE') => readonly string[]
  formatCurrency: (amount: number, currency?: string) => string
}

const initialEntryForm: BookkeepingEntryFormData = {
  companyId: 0,
  type: 'EXPENSE',
  category: '',
  subcategory: '',
  description: '',
  amount: 0,
  currency: 'USD',
  date: getLocalDateString(),
  reference: '',
  notes: '',
  accountId: '',
  accountType: 'BANK',
  cogs: 0,
  cogsPaid: 0,
}

const initialAccountForm = {
  companyId: 0,
  type: 'BANK',
  name: '',
  accountNumber: '',
  currency: 'USD',
  startingBalance: 0,
}

export function useBookkeepingManagement(
  selectedCompany: number | 'all' = 'all',
  companies?: any[] // Compatibility parameter
): BookkeepingManagementHook {
  const queryClient = useQueryClient()
  
  // Search with debouncing
  const { searchValue, debouncedSearchValue, isSearching, setSearchValue } = useDebouncedSearch('', 300)
  
  // UI State
  const [showEntryDialog, setShowEntryDialog] = useState(false)
  const [showAccountDialog, setShowAccountDialog] = useState(false)
  const [editingEntry, setEditingEntry] = useState<BookkeepingEntry | null>(null)
  const [editingAccount, setEditingAccount] = useState<CompanyAccount | null>(null)
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  
  // Form State
  const [entryForm, setEntryForm] = useState<BookkeepingEntryFormData>(initialEntryForm)
  const [accountForm, setAccountForm] = useState(initialAccountForm)
  
  // Compatibility state
  const [showInvoiceSelect, setShowInvoiceSelect] = useState(false)
  
  // Filters and Pagination
  const [filters, setFilters] = useState({
    companyId: selectedCompany,
    type: undefined as 'INCOME' | 'EXPENSE' | undefined,
    category: undefined as string | undefined,
    period: 'thisMonth' as PeriodFilter,
    accountId: undefined as string | undefined,
  })
  const [pagination, setPagination] = useState({ skip: 0, take: 20 })
  
  // Build query parameters
  const queryParams: BookkeepingQueryParams = useMemo(() => {
    const params: BookkeepingQueryParams = {
      companyId: typeof filters.companyId === 'number' ? filters.companyId : 0,
      ...pagination,
      period: filters.period,
    }
    
    if (filters.type) params.type = filters.type
    if (filters.category) params.category = filters.category
    if (debouncedSearchValue) params.search = debouncedSearchValue
    if (filters.accountId) params.accountId = filters.accountId
    
    return params
  }, [filters, pagination, debouncedSearchValue])
  
  // Entries Query
  const {
    data: entriesResponse,
    isLoading: isEntriesLoading,
    isError: isEntriesError,
    error: entriesError,
  } = useQuery({
    queryKey: [BOOKKEEPING_ENTRIES_QUERY_KEY, queryParams],
    queryFn: () => bookkeepingApiService.getEntries(queryParams),
    enabled: typeof filters.companyId === 'number',
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
  
  // Accounts Query
  const { data: accountsResponse, isLoading: isAccountsLoading } = useQuery({
    queryKey: [BOOKKEEPING_ACCOUNTS_QUERY_KEY, filters.companyId],
    queryFn: () => bookkeepingApiService.getAccounts(
      typeof filters.companyId === 'number' ? filters.companyId : 0
    ),
    enabled: typeof filters.companyId === 'number',
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Transactions Query
  const { data: transactionsResponse, isLoading: isTransactionsLoading } = useQuery({
    queryKey: [BOOKKEEPING_TRANSACTIONS_QUERY_KEY, filters.companyId],
    queryFn: () => bookkeepingApiService.getTransactions({
      companyId: typeof filters.companyId === 'number' ? filters.companyId : 0,
      take: 50,
    }),
    enabled: typeof filters.companyId === 'number',
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Statistics Query
  const { data: statistics, isLoading: isStatisticsLoading } = useQuery({
    queryKey: [BOOKKEEPING_STATISTICS_QUERY_KEY, filters.companyId, filters.period],
    queryFn: () => bookkeepingApiService.getStatistics(
      typeof filters.companyId === 'number' ? filters.companyId : 0,
      { period: filters.period }
    ),
    enabled: typeof filters.companyId === 'number',
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Extract data from responses
  const entries = entriesResponse?.data || []
  const accounts = accountsResponse?.data || []
  const transactions = transactionsResponse?.data || []
  const paginationData = entriesResponse?.pagination || { skip: 0, take: 20, total: 0, hasMore: false }
  
  // Compatibility layer: Transform statistics to financialSummary format
  const financialSummary: ExtendedFinancialSummary = useMemo(() => {
    if (!statistics?.summary) {
      return {
        revenue: 0,
        income: 0,
        cogs: 0,
        actualExpenses: 0,
        accountsPayable: 0,
        netProfit: 0,
        actualCogsPaid: 0,
        projectedNetProfit: 0,
        profitMargin: '0.0%'
      }
    }
    
    const summary = statistics?.summary
    return {
      revenue: summary?.totalIncome || 0,
      income: summary?.totalIncome || 0, // Map income to revenue for compatibility
      cogs: summary?.totalCogs || 0,
      actualExpenses: summary?.totalExpenses || 0,
      accountsPayable: (summary?.totalCogs || 0) - (summary?.totalCogs || 0), // Calculate from COGS difference
      netProfit: summary?.netProfit || 0,
      actualCogsPaid: summary?.totalCogs || 0,
      projectedNetProfit: summary?.netProfit || 0,
      profitMargin: `${(summary?.profitMargin || 0).toFixed(1)}%`
    }
  }, [statistics])
  
  // Compatibility layer: Create enriched entries
  const enrichedEntries: EnrichedBookkeepingEntry[] = useMemo(() => 
    entries.map(entry => ({
      ...entry,
      company: undefined, // TODO: Add company lookup if needed
      accountsPayable: 0 // Calculate based on COGS logic if needed
    }))
  , [entries])
  
  // Compatibility layer: Filtered entries (same as entries for now)
  const filteredEntries = useMemo(() => entries, [entries])
  
  // Compatibility layer: Expense breakdown with percentages
  const expenseBreakdown: ExpenseBreakdownWithPercentage[] = useMemo(() => 
    statistics?.expenseByCategory?.map(item => ({
      category: item.category,
      amount: item.amount,
      percentage: (statistics?.summary?.totalExpenses || 0) > 0 
        ? (item.amount / (statistics?.summary?.totalExpenses || 1)) * 100 
        : 0
    })) || []
  , [statistics])
  
  // Compatibility computed properties
  const isLoaded = !isEntriesLoading && !isStatisticsLoading
  const selectedPeriod = filters.period
  const activeCompanies: Company[] = [] // TODO: Add companies if needed
  const availableInvoices: any[] = [] // TODO: Add invoices if needed
  const entryFormData = entryForm
  const isAllExpanded = expandedEntries.size === entries.length
  
  // Mutations
  const createEntryMutation = useMutation({
    mutationFn: (data: BookkeepingEntryFormData) => bookkeepingApiService.createEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKKEEPING_ENTRIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [BOOKKEEPING_STATISTICS_QUERY_KEY] })
      toast.success('Entry created successfully')
      setShowEntryDialog(false)
      resetEntryForm()
    },
    onError: (error: Error) => {
      toast.error(`Failed to create entry: ${error.message}`)
    },
  })
  
  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BookkeepingEntryFormData> }) =>
      bookkeepingApiService.updateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKKEEPING_ENTRIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [BOOKKEEPING_STATISTICS_QUERY_KEY] })
      toast.success('Entry updated successfully')
      setEditingEntry(null)
      setShowEntryDialog(false)
      resetEntryForm()
    },
    onError: (error: Error) => {
      toast.error(`Failed to update entry: ${error.message}`)
    },
  })
  
  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => bookkeepingApiService.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKKEEPING_ENTRIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [BOOKKEEPING_STATISTICS_QUERY_KEY] })
      toast.success('Entry deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete entry: ${error.message}`)
    },
  })
  
  const createAccountMutation = useMutation({
    mutationFn: (data: typeof accountForm) => bookkeepingApiService.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKKEEPING_ACCOUNTS_QUERY_KEY] })
      toast.success('Account created successfully')
      setShowAccountDialog(false)
      resetAccountForm()
    },
    onError: (error: Error) => {
      toast.error(`Failed to create account: ${error.message}`)
    },
  })
  
  // Action handlers
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination({ skip: 0, take: 20 }) // Reset pagination when filters change
  }, [])
  
  const loadMore = useCallback(() => {
    if (paginationData.hasMore) {
      setPagination(prev => ({ ...prev, skip: prev.skip + prev.take }))
    }
  }, [paginationData.hasMore])
  
  const resetPagination = useCallback(() => {
    setPagination({ skip: 0, take: 20 })
  }, [])
  
  const updateEntryForm = useCallback((field: string, value: any) => {
    setEntryForm(prev => ({ ...prev, [field]: value }))
  }, [])
  
  const updateAccountForm = useCallback((field: string, value: any) => {
    setAccountForm(prev => ({ ...prev, [field]: value }))
  }, [])
  
  const resetEntryForm = useCallback(() => {
    setEntryForm(initialEntryForm)
  }, [])
  
  const resetAccountForm = useCallback(() => {
    setAccountForm(initialAccountForm)
  }, [])
  
  // CRUD Operations
  const createEntry = useCallback(async () => {
    createEntryMutation.mutate(entryForm)
  }, [entryForm, createEntryMutation])
  
  const updateEntry = useCallback(async () => {
    if (!editingEntry) return
    updateEntryMutation.mutate({ id: editingEntry.id, data: entryForm })
  }, [editingEntry, entryForm, updateEntryMutation])
  
  const deleteEntry = useCallback(async (id: string) => {
    deleteEntryMutation.mutate(id)
  }, [deleteEntryMutation])

  // Compatibility action handlers
  const setSelectedPeriod = useCallback((period: PeriodFilter) => {
    updateFilters({ period })
  }, [updateFilters])
  
  const handleEntryInputChange = useCallback((name: string, value: string) => {
    updateEntryForm(name, value)
  }, [updateEntryForm])
  
  const handleEntrySubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEntry) {
      await updateEntry()
    } else {
      await createEntry()
    }
  }, [editingEntry, updateEntry, createEntry])
  
  const handleEditEntry = useCallback((entry: BookkeepingEntry) => {
    setEditingEntry(entry)
    setEntryForm({
      companyId: entry.companyId,
      type: entry.type as 'INCOME' | 'EXPENSE',
      category: entry.category,
      subcategory: entry.subcategory || '',
      description: entry.description,
      amount: entry.amount,
      currency: entry.currency,
      date: entry.date,
      reference: entry.reference || '',
      notes: entry.notes || '',
      accountId: entry.accountId || '',
      accountType: (entry.accountType as 'BANK' | 'WALLET') || 'BANK',
      cogs: entry.cogs || 0,
      cogsPaid: entry.cogsPaid || 0,
    })
    setShowEntryDialog(true)
  }, [])
  
  const handleDeleteEntry = useCallback(async (id: string) => {
    await deleteEntry(id)
  }, [deleteEntry])
  
  const handleDialogCancel = useCallback(() => {
    setShowEntryDialog(false)
    setEditingEntry(null)
    resetEntryForm()
  }, [resetEntryForm])
  
  const toggleAllEntriesExpansion = useCallback(() => {
    if (expandedEntries.size === entries.length) {
      setExpandedEntries(new Set())
    } else {
      setExpandedEntries(new Set(entries.map(e => e.id)))
    }
  }, [entries, expandedEntries.size])
  
  const handleInvoiceReferenceChange = useCallback((value: string) => {
    updateEntryForm('reference', value)
  }, [updateEntryForm])
  
  // Account CRUD Operations
  const createAccount = useCallback(async () => {
    createAccountMutation.mutate(accountForm)
  }, [accountForm, createAccountMutation])
  
  const updateAccount = useCallback(async () => {
    // TODO: Implement account update
  }, [])
  
  const deleteAccount = useCallback(async (id: string) => {
    // TODO: Implement account deletion
  }, [])
  
  // Bulk Operations
  const bulkDeleteEntries = useCallback(async (ids: string[]) => {
    await bookkeepingApiService.bulkDeleteEntries(ids)
    queryClient.invalidateQueries({ queryKey: [BOOKKEEPING_ENTRIES_QUERY_KEY] })
    queryClient.invalidateQueries({ queryKey: [BOOKKEEPING_STATISTICS_QUERY_KEY] })
    toast.success(`Deleted ${ids.length} entries`)
  }, [queryClient])
  
  const bulkUpdateCategory = useCallback(async (ids: string[], category: string) => {
    await bookkeepingApiService.bulkUpdateEntriesCategory(ids, category)
    queryClient.invalidateQueries({ queryKey: [BOOKKEEPING_ENTRIES_QUERY_KEY] })
    toast.success(`Updated ${ids.length} entries`)
  }, [queryClient])
  
  // UI Actions
  const toggleEntryExpansion = useCallback((entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(entryId)) {
        newSet.delete(entryId)
      } else {
        newSet.add(entryId)
      }
      return newSet
    })
  }, [])
  
  const toggleAllExpansion = useCallback(() => {
    if (expandedEntries.size === entries.length) {
      setExpandedEntries(new Set())
    } else {
      setExpandedEntries(new Set(entries.map(e => e.id)))
    }
  }, [entries, expandedEntries.size])
  
  // Utility functions
  const getAvailableCategories = useCallback((type: 'INCOME' | 'EXPENSE') => {
    return type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  }, [])
  
  const formatCurrency = useCallback((amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }, [])
  
  return {
    // Data with loading states
    entries,
    isEntriesLoading,
    isEntriesError,
    entriesError: entriesError as Error | null,
    
    accounts,
    isAccountsLoading,
    
    transactions,
    isTransactionsLoading,
    
    statistics,
    isStatisticsLoading,
    
    // Compatibility layer for old hook interface
    filteredEntries,
    enrichedEntries,
    financialSummary,
    expenseBreakdown,
    isLoaded,
    selectedPeriod,
    activeCompanies,
    availableInvoices,
    entryFormData,
    showInvoiceSelect,
    isAllExpanded,
    
    // Pagination
    pagination: paginationData,
    
    // Search
    searchValue,
    debouncedSearchValue,
    isSearching,
    setSearchValue,
    
    // Filters
    filters,
    
    // UI State
    showEntryDialog,
    showAccountDialog,
    editingEntry,
    editingAccount,
    expandedEntries,
    
    // Form State
    entryForm,
    accountForm,
    
    // Actions
    setShowEntryDialog,
    setShowAccountDialog,
    setEditingEntry,
    setEditingAccount,
    updateFilters,
    
    // Pagination
    loadMore,
    resetPagination,
    
    // Form Handlers
    updateEntryForm,
    updateAccountForm,
    resetEntryForm,
    resetAccountForm,
    
    // CRUD Operations
    createEntry,
    updateEntry,
    deleteEntry,
    
    createAccount,
    updateAccount,
    deleteAccount,
    
    // Bulk Operations
    bulkDeleteEntries,
    bulkUpdateCategory,
    
    // UI Actions
    toggleEntryExpansion,
    toggleAllExpansion,
    
    // Compatibility actions
    setSelectedPeriod,
    setShowInvoiceSelect,
    handleEntryInputChange,
    handleEntrySubmit,
    handleEditEntry,
    handleDeleteEntry,
    handleDialogCancel,
    toggleAllEntriesExpansion,
    handleInvoiceReferenceChange,
    
    // Utility
    getAvailableCategories,
    formatCurrency,
  }
}