import { BalanceListResponse, BalanceListItem } from '@/services/database/balanceSSRService'

export interface BalancesResponse {
  data: BalanceListItem[]
  summary: {
    totalAssets: number
    totalLiabilities: number
    netWorth: number
    accountCount: number
    bankAccountCount: number
    walletCount: number
    currencyBreakdown: Record<string, {
      assets: number
      liabilities: number
      netWorth: number
    }>
  }
  filters: {
    selectedPeriod: string
    customDateRange: { startDate: string; endDate: string }
    accountTypeFilter: string
    viewFilter: string
    groupBy: string
    searchTerm: string
    showZeroBalances: boolean
  }
}

export interface BalanceQueryParams {
  company?: number | 'all'
  accountType?: string
  search?: string
  showZeroBalances?: boolean
  viewFilter?: string
  groupBy?: string
  selectedPeriod?: string
  startDate?: string
  endDate?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export interface InitialBalanceFormData {
  accountId: string
  accountType: 'bank' | 'wallet'
  amount: number
  currency: string
  companyId: number
  notes?: string
}

export interface InitialBalance {
  id: string
  accountId: string
  accountType: string
  amount: number
  currency: string
  companyId: number
  notes?: string
  createdAt: string
  updatedAt: string
  company: {
    id: number
    tradingName: string
    legalName: string
    logo: string
  }
}

export class BalanceApiService {
  private baseUrl = '/api/bookkeeping/balances'

  async getBalances(params: BalanceQueryParams = {}): Promise<BalancesResponse> {
    const searchParams = new URLSearchParams()
    
    // Add filters
    if (params.company && params.company !== 'all') {
      searchParams.set('company', params.company.toString())
    }
    if (params.accountType) searchParams.set('accountType', params.accountType)
    if (params.search) searchParams.set('search', params.search)
    if (params.showZeroBalances !== undefined) {
      searchParams.set('showZeroBalances', params.showZeroBalances.toString())
    }
    if (params.viewFilter) searchParams.set('viewFilter', params.viewFilter)
    if (params.groupBy) searchParams.set('groupBy', params.groupBy)
    if (params.selectedPeriod) searchParams.set('selectedPeriod', params.selectedPeriod)
    if (params.startDate) searchParams.set('startDate', params.startDate)
    if (params.endDate) searchParams.set('endDate', params.endDate)
    
    // Add sorting
    if (params.sortField) searchParams.set('sortField', params.sortField)
    if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection)

    const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`)
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - please log in')
      }
      throw new Error('Failed to fetch balances')
    }
    
    return response.json()
  }

  async getInitialBalance(id: string): Promise<InitialBalance> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Initial balance not found')
      }
      if (response.status === 401) {
        throw new Error('Unauthorized - please log in')
      }
      throw new Error('Failed to fetch initial balance')
    }
    
    return response.json()
  }

  async createInitialBalance(data: InitialBalanceFormData): Promise<InitialBalance> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - please log in')
      }
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Invalid data provided')
      }
      throw new Error('Failed to create initial balance')
    }
    
    return response.json()
  }

  async updateInitialBalance(id: string, data: Partial<InitialBalanceFormData>): Promise<InitialBalance> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Initial balance not found')
      }
      if (response.status === 401) {
        throw new Error('Unauthorized - please log in')
      }
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Invalid data provided')
      }
      throw new Error('Failed to update initial balance')
    }
    
    return response.json()
  }

  async deleteInitialBalance(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Initial balance not found')
      }
      if (response.status === 401) {
        throw new Error('Unauthorized - please log in')
      }
      throw new Error('Failed to delete initial balance')
    }
    
    return response.json()
  }

  /**
   * Create or update initial balance (upsert operation)
   * This is the primary method for setting initial balances
   */
  async saveInitialBalance(data: InitialBalanceFormData): Promise<InitialBalance> {
    return this.createInitialBalance(data)
  }
}