/**
 * Transaction API Service for client-side operations
 * Handles all HTTP API calls for transaction management
 */

import { PeriodPreset } from '@/services/utils/periodFilterService';

export interface TransactionQueryParams {
  skip?: number
  take?: number
  searchTerm?: string
  status?: 'all' | 'pending' | 'cleared' | 'cancelled'
  reconciliationStatus?: 'all' | 'unreconciled' | 'reconciled' | 'auto_reconciled'
  approvalStatus?: 'all' | 'pending' | 'approved' | 'rejected'
  accountId?: string
  accountType?: 'all' | 'bank' | 'wallet'
  currency?: string
  companyId?: number | 'all'
  dateRange?: PeriodPreset
  dateFrom?: string
  dateTo?: string
  sortField?: 'date' | 'paidBy' | 'paidTo' | 'netAmount' | 'currency' | 'category' | 'status' | 'createdAt' | 'updatedAt'
  sortDirection?: 'asc' | 'desc'
  cursor?: string
  includeBlockchainTransactions?: boolean
}

export interface TransactionFormData {
  date: string
  paidBy: string
  paidTo: string
  netAmount: number
  incomingAmount: number
  outgoingAmount: number
  currency: string
  baseCurrency: string
  baseCurrencyAmount: number
  exchangeRate: number
  accountId: string
  accountType: 'bank' | 'wallet'
  reference?: string
  category: string
  description?: string
  linkedEntryId?: string
  linkedEntryType?: string
  status?: 'PENDING' | 'CLEARED' | 'CANCELLED'
  reconciliationStatus?: 'UNRECONCILED' | 'RECONCILED' | 'AUTO_RECONCILED'
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  companyId: number
}

export interface TransactionItem {
  id: string
  date: string
  paidBy: string
  paidTo: string
  netAmount: number
  incomingAmount: number
  outgoingAmount: number
  currency: string
  baseCurrency: string
  baseCurrencyAmount: number
  exchangeRate: number
  accountId: string
  accountType: 'bank' | 'wallet'
  reference?: string
  category: string
  description?: string
  linkedEntryId?: string
  linkedEntryType?: string
  status: 'PENDING' | 'CLEARED' | 'CANCELLED'
  reconciliationStatus: 'UNRECONCILED' | 'RECONCILED' | 'AUTO_RECONCILED'
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  companyId: number
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  
  // Relations populated by API
  company?: {
    id: number
    tradingName: string
    legalName: string
  }
  linkedEntry?: {
    id: string
    type: string
    category: string
    amount: number
    currency: string
    description: string
  }
  attachments?: {
    id: string
    fileName: string
    filePath: string
    fileSize: number
    mimeType: string
    createdAt: string
  }[]
}

export interface TransactionResponse {
  data: TransactionItem[]
  pagination?: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  cursor?: string
  hasMore?: boolean
  statistics?: {
    total: number
    totalIncoming: number
    totalOutgoing: number
    netAmount: number
  }
}

export interface TransactionStatistics {
  summary: {
    totalTransactions: number
    totalIncoming: number
    totalOutgoing: number
    netAmount: number
  }
  statusBreakdown: {
    pending: { count: number; amount: number }
    cleared: { count: number; amount: number }
    cancelled: { count: number; amount: number }
  }
  accountAnalysis: {
    bankTransactions: { count: number; amount: number }
    walletTransactions: { count: number; amount: number }
  }
  periodAnalysis: {
    thisMonth: { count: number; incoming: number; outgoing: number; net: number }
    lastMonth: { count: number; incoming: number; outgoing: number; net: number }
    thisYear: { count: number; incoming: number; outgoing: number; net: number }
    lastYear: { count: number; incoming: number; outgoing: number; net: number }
  }
  byCurrency: Record<string, { count: number; incoming: number; outgoing: number; net: number }>
  byCategory: Record<string, { count: number; incoming: number; outgoing: number; net: number }>
  newThisMonth: number
}

export class TransactionApiService {
  private static readonly BASE_URL = '/api/transactions'

  /**
   * Fetch transactions with pagination and filtering
   */
  static async getTransactions(params: TransactionQueryParams = {}): Promise<TransactionResponse> {
    try {
      const url = new URL(this.BASE_URL, window.location.origin)
      
      // Add query parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      throw error
    }
  }

  /**
   * Fetch transactions using cursor pagination (for better performance)
   */
  static async getTransactionsCursor(params: TransactionQueryParams = {}): Promise<TransactionResponse> {
    try {
      const url = new URL(`${this.BASE_URL}/cursor`, window.location.origin)
      
      // Add query parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch transactions with cursor:', error)
      throw error
    }
  }

  /**
   * Fetch a single transaction by ID
   */
  static async getTransaction(id: string): Promise<TransactionItem> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Failed to fetch transaction ${id}:`, error)
      throw error
    }
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(data: TransactionFormData): Promise<TransactionItem> {
    try {
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to create transaction:', error)
      throw error
    }
  }

  /**
   * Create multiple transactions in bulk
   */
  static async createTransactionsBulk(transactions: TransactionFormData[]): Promise<TransactionItem[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ transactions }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to create transactions in bulk:', error)
      throw error
    }
  }

  /**
   * Update an existing transaction
   */
  static async updateTransaction(id: string, data: Partial<TransactionFormData>): Promise<TransactionItem> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Failed to update transaction ${id}:`, error)
      throw error
    }
  }

  /**
   * Delete a transaction (soft delete)
   */
  static async deleteTransaction(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error(`Failed to delete transaction ${id}:`, error)
      throw error
    }
  }

  /**
   * Delete multiple transactions in bulk
   */
  static async deleteTransactionsBulk(ids: string[]): Promise<void> {
    try {
      const response = await fetch(`${this.BASE_URL}/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ids }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to delete transactions in bulk:', error)
      throw error
    }
  }

  /**
   * Fetch transaction statistics
   */
  static async getTransactionStatistics(companyId?: number | 'all'): Promise<TransactionStatistics> {
    try {
      const url = new URL(`${this.BASE_URL}/statistics`, window.location.origin)
      
      if (companyId !== undefined) {
        url.searchParams.append('companyId', String(companyId))
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch transaction statistics:', error)
      throw error
    }
  }

  /**
   * Link a transaction to a bookkeeping entry
   */
  static async linkTransaction(transactionId: string, entryId: string): Promise<TransactionItem> {
    try {
      const response = await fetch(`${this.BASE_URL}/${transactionId}/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ entryId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Failed to link transaction ${transactionId}:`, error)
      throw error
    }
  }

  /**
   * Unlink a transaction from a bookkeeping entry
   */
  static async unlinkTransaction(transactionId: string): Promise<TransactionItem> {
    try {
      const response = await fetch(`${this.BASE_URL}/${transactionId}/unlink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Failed to unlink transaction ${transactionId}:`, error)
      throw error
    }
  }

  /**
   * Update transaction status (approve, reject, clear, etc.)
   */
  static async updateTransactionStatus(
    id: string, 
    status: 'PENDING' | 'CLEARED' | 'CANCELLED',
    reconciliationStatus?: 'UNRECONCILED' | 'RECONCILED' | 'AUTO_RECONCILED',
    approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<TransactionItem> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          status,
          reconciliationStatus,
          approvalStatus
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Failed to update transaction status ${id}:`, error)
      throw error
    }
  }

  /**
   * Export transactions to CSV/Excel
   */
  static async exportTransactions(
    params: TransactionQueryParams = {},
    format: 'csv' | 'excel' = 'csv'
  ): Promise<Blob> {
    try {
      const url = new URL(`${this.BASE_URL}/export`, window.location.origin)
      
      // Add format parameter
      url.searchParams.append('format', format)
      
      // Add query parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.blob()
    } catch (error) {
      console.error('Failed to export transactions:', error)
      throw error
    }
  }

  /**
   * Import transactions from CSV/Excel file
   */
  static async importTransactions(file: File, companyId: number): Promise<{ 
    success: number; 
    errors: Array<{ row: number; error: string }> 
  }> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companyId', String(companyId))

      const response = await fetch(`${this.BASE_URL}/import`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to import transactions:', error)
      throw error
    }
  }

  /**
   * Import blockchain transactions for a specific period
   */
  static async importBlockchainTransactions(
    walletId: string, 
    params: {
      startDate?: string;
      endDate?: string;
      currencies?: string[];
      overwriteDuplicates?: boolean;
      createInitialBalances?: boolean;
    }
  ): Promise<{
    success: boolean;
    totalTransactions: number;
    importedTransactions: number;
    duplicateTransactions: number;
    failedTransactions: number;
    errors: string[];
  }> {
    try {
      const response = await fetch('/api/blockchain/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          walletId,
          ...params,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.result || data
    } catch (error) {
      console.error('Failed to import blockchain transactions:', error)
      throw error
    }
  }

  /**
   * Get blockchain transaction import status
   */
  static async getBlockchainImportStatus(walletId: string): Promise<{
    statuses: Array<{
      id: string;
      walletId: string;
      status: 'running' | 'completed' | 'failed';
      progress: {
        totalCurrencies: number;
        completedCurrencies: number;
        totalTransactions: number;
        processedTransactions: number;
      };
      createdAt: string;
      completedAt?: string;
      error?: string;
    }>;
  }> {
    try {
      const url = new URL('/api/blockchain/transactions/import', window.location.origin)
      url.searchParams.append('walletId', walletId)

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get blockchain import status:', error)
      throw error
    }
  }
}