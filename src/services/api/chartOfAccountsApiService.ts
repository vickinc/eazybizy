import { ChartOfAccount, ChartOfAccountFormData } from '@/types/chartOfAccounts.types'

export interface ChartOfAccountsResponse {
  data: ChartOfAccount[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  statistics: {
    total: number
    averageBalance: number
    totalBalance: number
    typeStats: Record<string, number>
    activeStats: Record<string, number>
  }
}

export interface ChartOfAccountsQueryParams {
  skip?: number
  take?: number
  search?: string
  type?: string
  category?: string
  isActive?: boolean | string
  company?: number | 'all'
  accountType?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export class ChartOfAccountsApiService {
  private baseUrl = '/api/chart-of-accounts'

  async getChartOfAccounts(params: ChartOfAccountsQueryParams = {}): Promise<ChartOfAccountsResponse> {
    const searchParams = new URLSearchParams()
    
    // Add pagination
    if (params.skip !== undefined) searchParams.set('skip', params.skip.toString())
    if (params.take !== undefined) searchParams.set('take', params.take.toString())
    
    // Add filters
    if (params.search) searchParams.set('search', params.search)
    if (params.type && params.type !== 'all') searchParams.set('type', params.type)
    if (params.category && params.category !== 'all') searchParams.set('category', params.category)
    if (params.isActive !== undefined && params.isActive !== 'all') {
      searchParams.set('isActive', params.isActive.toString())
    }
    if (params.company && params.company !== 'all') {
      searchParams.set('company', params.company.toString())
    }
    if (params.accountType && params.accountType !== 'all') {
      searchParams.set('accountType', params.accountType)
    }
    
    // Add sorting
    if (params.sortField) searchParams.set('sortField', params.sortField)
    if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection)

    const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch chart of accounts')
    }
    
    return response.json()
  }

  async getChartOfAccount(id: string): Promise<ChartOfAccount> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Account not found')
      }
      throw new Error('Failed to fetch account')
    }
    
    return response.json()
  }

  async createChartOfAccount(data: ChartOfAccountFormData & { companyId?: number }): Promise<ChartOfAccount> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to create account')
    }
    
    return response.json()
  }

  async updateChartOfAccount(id: string, data: Partial<ChartOfAccountFormData>): Promise<ChartOfAccount> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to update account')
    }
    
    return response.json()
  }

  async deleteChartOfAccount(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to delete account')
    }
  }

  // Utility method for bulk operations (optional)
  async bulkCreateChartOfAccounts(accounts: (ChartOfAccountFormData & { companyId?: number })[]): Promise<ChartOfAccount[]> {
    const promises = accounts.map(account => this.createChartOfAccount(account))
    return Promise.all(promises)
  }

  // Utility method to get accounts by type
  async getAccountsByType(type: string, companyId?: number): Promise<ChartOfAccount[]> {
    const params: ChartOfAccountsQueryParams = {
      type,
      take: 1000, // Large number to get all accounts of this type
    }
    
    if (companyId) {
      params.company = companyId
    }
    
    const response = await this.getChartOfAccounts(params)
    return response.data
  }

  // Utility method to search accounts
  async searchAccounts(searchTerm: string, companyId?: number): Promise<ChartOfAccount[]> {
    const params: ChartOfAccountsQueryParams = {
      search: searchTerm,
      take: 100, // Reasonable limit for search results
    }
    
    if (companyId) {
      params.company = companyId
    }
    
    const response = await this.getChartOfAccounts(params)
    return response.data
  }

  // Utility method to check if account code is unique
  async isAccountCodeUnique(code: string, excludeId?: string): Promise<boolean> {
    try {
      const response = await this.getChartOfAccounts({ search: code, take: 1 })
      const exactMatch = response.data.find(account => 
        account.code === code && account.id !== excludeId
      )
      return !exactMatch
    } catch (error) {
      console.error('Error checking account code uniqueness:', error)
      return false
    }
  }

  // Utility method for bulk deletion
  async bulkDeleteChartOfAccounts(companyId?: number | 'null'): Promise<{ deletedCount: number; message: string }> {
    const searchParams = new URLSearchParams()
    searchParams.set('bulk', 'true')
    
    if (companyId !== undefined) {
      searchParams.set('companyId', companyId === 'null' ? 'null' : companyId.toString())
    }

    const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to bulk delete accounts')
    }
    
    return response.json()
  }
}