export interface TransactionQueryParams {
  companyId: number
  skip?: number
  take?: number
  accountId?: string
  accountType?: 'BANK' | 'WALLET' | 'CASH' | 'CREDIT_CARD'
  search?: string
  dateFrom?: string
  dateTo?: string
  period?: 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'
  category?: string
  subcategory?: string
  status?: 'PENDING' | 'CLEARED' | 'FAILED' | 'CANCELLED'
  reconciliationStatus?: 'UNRECONCILED' | 'RECONCILED' | 'DISPUTED'
  currency?: string
  sortField?: 'date' | 'amount' | 'paidBy' | 'paidTo' | 'category' | 'account'
  sortDirection?: 'asc' | 'desc'
  includeDeleted?: boolean
}

export interface TransactionFormData {
  companyId: number
  date: string
  paidBy: string
  paidTo: string
  netAmount: number
  incomingAmount?: number
  outgoingAmount?: number
  currency: string
  baseCurrency?: string
  baseCurrencyAmount?: number
  exchangeRate?: number
  accountId: string
  accountType: 'BANK' | 'WALLET' | 'CASH' | 'CREDIT_CARD'
  reference?: string
  category?: string
  subcategory?: string
  description?: string
  notes?: string
  tags?: string[]
  status?: 'PENDING' | 'CLEARED' | 'FAILED' | 'CANCELLED'
  reconciliationStatus?: 'UNRECONCILED' | 'RECONCILED' | 'DISPUTED'
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  isRecurring?: boolean
  recurringPattern?: string
  parentTransactionId?: string
  linkedEntryId?: string
  linkedEntryType?: 'INCOME' | 'EXPENSE'
  createdBy?: string
}

export interface Transaction {
  id: string
  companyId: number
  date: string
  paidBy: string
  paidTo: string
  netAmount: number
  incomingAmount?: number
  outgoingAmount?: number
  currency: string
  baseCurrency: string
  baseCurrencyAmount: number
  exchangeRate?: number
  accountId: string
  accountType: 'BANK' | 'WALLET' | 'CASH' | 'CREDIT_CARD'
  reference?: string
  category?: string
  subcategory?: string
  description?: string
  notes?: string
  tags: string[]
  linkedEntryId?: string
  linkedEntryType?: 'INCOME' | 'EXPENSE'
  status: 'PENDING' | 'CLEARED' | 'FAILED' | 'CANCELLED'
  reconciliationStatus: 'UNRECONCILED' | 'RECONCILED' | 'DISPUTED'
  statementDate?: string
  statementReference?: string
  isRecurring: boolean
  recurringPattern?: string
  parentTransactionId?: string
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedBy?: string
  approvedAt?: string
  isDeleted: boolean
  deletedAt?: string
  deletedBy?: string
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
  
  // Relations
  company?: {
    id: number
    tradingName: string
    legalName: string
  }
  companyAccount?: {
    id: string
    name: string
    type: string
    currency: string
  }
  bankAccount?: {
    id: string
    accountName: string
    bankName: string
    currency: string
    iban?: string
  }
  digitalWallet?: {
    id: string
    walletName: string
    walletType: string
    currency: string
    walletAddress?: string
  }
  linkedEntry?: {
    id: string
    type: string
    category: string
    description: string
    amount: number
  }
  parentTransaction?: {
    id: string
    reference?: string
    description?: string
    netAmount: number
    date: string
  }
  childTransactions?: Array<{
    id: string
    reference?: string
    description?: string
    netAmount: number
    date: string
  }>
  attachments?: Array<{
    id: string
    fileName: string
    filePath?: string
    fileSize: number
    mimeType: string
    uploadedBy?: string
    createdAt: string
  }>
}

export interface TransactionsResponse {
  data: Transaction[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  statistics: {
    totalTransactions: number
    totalNetAmount: number
    totalIncoming: number
    totalOutgoing: number
    currencyBreakdown: Array<{
      currency: string
      _sum: {
        netAmount?: number
        incomingAmount?: number
        outgoingAmount?: number
      }
      _count: number
    }>
    accountBreakdown: Array<{
      accountId: string
      accountType: string
      _sum: {
        netAmount?: number
        incomingAmount?: number
        outgoingAmount?: number
      }
      _count: number
    }>
  }
}

export interface TransactionStatistics {
  summary: {
    totalTransactions: number
    totalNetAmount: number
    totalIncoming: number
    totalOutgoing: number
    averageTransactionAmount: number
    netCashFlow: number
  }
  breakdowns: {
    byCurrency: Array<{
      currency: string
      _sum: {
        netAmount?: number
        incomingAmount?: number
        outgoingAmount?: number
      }
      _count: number
    }>
    byAccount: Array<{
      accountId: string
      accountType: string
      accountName: string
      accountCurrency?: string
      _sum: {
        netAmount?: number
        incomingAmount?: number
        outgoingAmount?: number
      }
      _count: number
    }>
    byCategory: Array<{
      category: string
      _sum: {
        netAmount?: number
        incomingAmount?: number
        outgoingAmount?: number
      }
      _count: number
    }>
    byStatus: Array<{
      status: string
      _sum: { netAmount?: number }
      _count: number
    }>
    byReconciliationStatus: Array<{
      reconciliationStatus: string
      _sum: { netAmount?: number }
      _count: number
    }>
  }
  trends: {
    monthly: Array<{
      month: string
      transaction_count: number
      total_net_amount: number
      total_incoming: number
      total_outgoing: number
      avg_transaction_amount: number
    }>
  }
  insights: {
    topTransactions: Array<{
      id: string
      date: string
      paidBy: string
      paidTo: string
      netAmount: number
      currency: string
      category?: string
      description?: string
    }>
    mostUsedCurrency: string | null
    mostActiveAccount: string | null
    reconciliationRate: number
    pendingApprovals: number
  }
}

export interface BulkOperationRequest {
  operation: 'create' | 'update' | 'delete' | 'categorize' | 'reconcile' | 'approve'
  data: unknown
}

export interface BulkOperationResponse {
  success: boolean
  created?: number
  updated?: number
  deleted?: number
  message: string
}

export class TransactionsApiService {
  private baseUrl = '/api/transactions'

  async getTransactions(params: TransactionQueryParams): Promise<TransactionsResponse> {
    const queryParams = new URLSearchParams()

    // Required parameter
    queryParams.append('companyId', params.companyId.toString())

    // Optional parameters
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params.take !== undefined) queryParams.append('take', params.take.toString())
    if (params.accountId) queryParams.append('accountId', params.accountId)
    if (params.accountType) queryParams.append('accountType', params.accountType)
    if (params.search) queryParams.append('search', params.search)
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params.period) queryParams.append('period', params.period)
    if (params.category) queryParams.append('category', params.category)
    if (params.subcategory) queryParams.append('subcategory', params.subcategory)
    if (params.status) queryParams.append('status', params.status)
    if (params.reconciliationStatus) queryParams.append('reconciliationStatus', params.reconciliationStatus)
    if (params.currency) queryParams.append('currency', params.currency)
    if (params.sortField) queryParams.append('sortField', params.sortField)
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection)
    if (params.includeDeleted) queryParams.append('includeDeleted', params.includeDeleted.toString())

    const response = await fetch(`${this.baseUrl}?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`)
    }
    return response.json()
  }

  async getTransaction(id: string): Promise<Transaction> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.status}`)
    }
    return response.json()
  }

  async createTransaction(data: TransactionFormData): Promise<Transaction> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to create transaction: ${response.status}`)
    }
    return response.json()
  }

  async updateTransaction(id: string, data: Partial<TransactionFormData>): Promise<Transaction> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to update transaction: ${response.status}`)
    }
    return response.json()
  }

  async deleteTransaction(id: string, hardDelete = false, deletedBy?: string): Promise<{ success: boolean }> {
    const queryParams = new URLSearchParams()
    if (hardDelete) queryParams.append('hard', 'true')
    if (deletedBy) queryParams.append('deletedBy', deletedBy)

    const response = await fetch(`${this.baseUrl}/${id}?${queryParams}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`Failed to delete transaction: ${response.status}`)
    }
    return response.json()
  }

  async getStatistics(companyId: number, options?: {
    period?: string
    dateFrom?: string
    dateTo?: string
    accountId?: string
    accountType?: string
    currency?: string
    groupBy?: string
  }): Promise<TransactionStatistics> {
    const queryParams = new URLSearchParams()
    queryParams.append('companyId', companyId.toString())

    if (options?.period) queryParams.append('period', options.period)
    if (options?.dateFrom) queryParams.append('dateFrom', options.dateFrom)
    if (options?.dateTo) queryParams.append('dateTo', options.dateTo)
    if (options?.accountId) queryParams.append('accountId', options.accountId)
    if (options?.accountType) queryParams.append('accountType', options.accountType)
    if (options?.currency) queryParams.append('currency', options.currency)
    if (options?.groupBy) queryParams.append('groupBy', options.groupBy)

    const response = await fetch(`${this.baseUrl}/statistics?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction statistics: ${response.status}`)
    }
    return response.json()
  }

  // Bulk Operations
  async bulkCreateTransactions(transactions: TransactionFormData[]): Promise<BulkOperationResponse> {
    return this.bulkOperation('create', transactions)
  }

  async bulkUpdateTransactions(ids: string[], updates: Partial<TransactionFormData>): Promise<BulkOperationResponse> {
    return this.bulkOperation('update', { ids, updates })
  }

  async bulkDeleteTransactions(ids: string[], hardDelete = false, deletedBy?: string): Promise<BulkOperationResponse> {
    return this.bulkOperation('delete', { ids, hardDelete, deletedBy })
  }

  async bulkCategorizeTransactions(ids: string[], category: string, subcategory?: string, updatedBy?: string): Promise<BulkOperationResponse> {
    return this.bulkOperation('categorize', { ids, category, subcategory, updatedBy })
  }

  async bulkReconcileTransactions(ids: string[], reconciliationStatus: string, statementDate?: string, statementReference?: string, updatedBy?: string): Promise<BulkOperationResponse> {
    return this.bulkOperation('reconcile', { ids, reconciliationStatus, statementDate, statementReference, updatedBy })
  }

  async bulkApproveTransactions(ids: string[], approvalStatus: string, approvedBy?: string): Promise<BulkOperationResponse> {
    return this.bulkOperation('approve', { ids, approvalStatus, approvedBy })
  }

  private async bulkOperation(operation: string, data: unknown): Promise<BulkOperationResponse> {
    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operation, data }),
    })
    if (!response.ok) {
      throw new Error(`Failed to perform bulk ${operation}: ${response.status}`)
    }
    return response.json()
  }
}

export const transactionsApiService = new TransactionsApiService()