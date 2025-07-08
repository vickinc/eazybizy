import { BookkeepingEntry, CompanyAccount, Transaction } from '@prisma/client'

// Type definitions for API responses
export interface BookkeepingEntriesResponse {
  data: BookkeepingEntry[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  statistics: {
    totalIncome: number
    totalExpenses: number
    totalCogs: number
    totalCogsPaid: number
    netProfit: number
    incomeCount: number
    expenseCount: number
    categoryBreakdown: Array<{
      category: string
      type: string
      _sum: { amount: number }
      _count: { _all: number }
    }>
  }
}

export interface BookkeepingStatistics {
  summary: {
    totalIncome: number
    totalExpenses: number
    totalCogs: number
    netProfit: number
    grossProfit: number
    profitMargin: number
    incomeCount: number
    expenseCount: number
  }
  incomeByCategory: Array<{
    category: string
    amount: number
    count: number
  }>
  expenseByCategory: Array<{
    category: string
    amount: number
    count: number
  }>
  monthlyTrends: Array<{
    month: string
    income: number
    expenses: number
    netProfit: number
  }>
  accountBalances: Array<{
    id: string
    name: string
    type: string
    currency: string
    currentBalance: number
  }>
  recentTransactions: any[]
}

export interface BookkeepingQueryParams {
  companyId: number
  skip?: number
  take?: number
  type?: 'INCOME' | 'EXPENSE'
  category?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  period?: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime'
  accountId?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export interface BookkeepingEntryFormData {
  companyId: number
  type: 'INCOME' | 'EXPENSE'
  category: string
  subcategory?: string
  description: string
  amount: number
  currency: string
  date: string
  reference?: string
  notes?: string
  accountId?: string
  accountType?: 'BANK' | 'WALLET' | 'CASH' | 'CREDIT_CARD'
  cogs?: number
  cogsPaid?: number
}

export class BookkeepingApiService {
  private baseUrl = '/api/bookkeeping'

  // Bookkeeping Entries
  async getEntries(params: BookkeepingQueryParams): Promise<BookkeepingEntriesResponse> {
    const searchParams = new URLSearchParams()
    
    // Add required company ID
    searchParams.set('companyId', params.companyId.toString())
    
    // Add pagination
    if (params.skip !== undefined) searchParams.set('skip', params.skip.toString())
    if (params.take !== undefined) searchParams.set('take', params.take.toString())
    
    // Add filters
    if (params.type) searchParams.set('type', params.type)
    if (params.category) searchParams.set('category', params.category)
    if (params.search) searchParams.set('search', params.search)
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params.dateTo) searchParams.set('dateTo', params.dateTo)
    if (params.period) searchParams.set('period', params.period)
    if (params.accountId) searchParams.set('accountId', params.accountId)
    
    // Add sorting
    if (params.sortField) searchParams.set('sortField', params.sortField)
    if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection)

    const response = await fetch(`${this.baseUrl}/entries?${searchParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch bookkeeping entries')
    }
    
    return response.json()
  }

  async getEntry(id: string): Promise<BookkeepingEntry> {
    const response = await fetch(`${this.baseUrl}/entries/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Bookkeeping entry not found')
      }
      throw new Error('Failed to fetch bookkeeping entry')
    }
    
    return response.json()
  }

  async createEntry(data: BookkeepingEntryFormData): Promise<BookkeepingEntry> {
    const response = await fetch(`${this.baseUrl}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create bookkeeping entry')
    }
    
    return response.json()
  }

  async updateEntry(id: string, data: Partial<BookkeepingEntryFormData>): Promise<BookkeepingEntry> {
    const response = await fetch(`${this.baseUrl}/entries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Bookkeeping entry not found')
      }
      throw new Error('Failed to update bookkeeping entry')
    }
    
    return response.json()
  }

  async deleteEntry(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/entries/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Bookkeeping entry not found')
      }
      throw new Error('Failed to delete bookkeeping entry')
    }
  }

  // Company Accounts
  async getAccounts(companyId: number, filters?: {
    type?: string
    isActive?: boolean
    currency?: string
  }): Promise<{ data: CompanyAccount[]; statistics: any }> {
    const searchParams = new URLSearchParams()
    searchParams.set('companyId', companyId.toString())
    
    if (filters?.type) searchParams.set('type', filters.type)
    if (filters?.isActive !== undefined) searchParams.set('isActive', filters.isActive.toString())
    if (filters?.currency) searchParams.set('currency', filters.currency)

    const response = await fetch(`${this.baseUrl}/accounts?${searchParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch company accounts')
    }
    
    return response.json()
  }

  async createAccount(data: {
    companyId: number
    type: string
    name: string
    accountNumber?: string
    currency: string
    startingBalance?: number
  }): Promise<CompanyAccount> {
    const response = await fetch(`${this.baseUrl}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create company account')
    }
    
    return response.json()
  }

  // Transactions
  async getTransactions(params: {
    companyId: number
    skip?: number
    take?: number
    accountId?: string
    accountType?: string
    search?: string
    dateFrom?: string
    dateTo?: string
    period?: string
    sortField?: string
    sortDirection?: 'asc' | 'desc'
  }): Promise<{
    data: Transaction[]
    pagination: any
    statistics: any
    accountBalances: any[]
  }> {
    const searchParams = new URLSearchParams()
    
    // Add required company ID
    searchParams.set('companyId', params.companyId.toString())
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'companyId' && value !== undefined) {
        searchParams.set(key, value.toString())
      }
    })

    const response = await fetch(`${this.baseUrl}/transactions?${searchParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch transactions')
    }
    
    return response.json()
  }

  // Statistics
  async getStatistics(companyId: number, params?: {
    period?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<BookkeepingStatistics> {
    const searchParams = new URLSearchParams()
    searchParams.set('companyId', companyId.toString())
    
    if (params?.period) searchParams.set('period', params.period)
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo)

    const response = await fetch(`${this.baseUrl}/statistics?${searchParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch bookkeeping statistics')
    }
    
    return response.json()
  }

  // Bulk operations
  async bulkDeleteEntries(ids: string[]): Promise<void> {
    const deletePromises = ids.map(id => this.deleteEntry(id))
    await Promise.all(deletePromises)
  }

  async bulkUpdateEntriesCategory(ids: string[], category: string): Promise<BookkeepingEntry[]> {
    const updatePromises = ids.map(id => 
      this.updateEntry(id, { category })
    )
    
    return Promise.all(updatePromises)
  }

  // Search entries
  async searchEntries(companyId: number, query: string, limit = 10): Promise<BookkeepingEntry[]> {
    const params = {
      companyId,
      search: query,
      take: limit,
    }
    
    const response = await this.getEntries(params)
    return response.data
  }
}

// Export singleton instance
export const bookkeepingApiService = new BookkeepingApiService()