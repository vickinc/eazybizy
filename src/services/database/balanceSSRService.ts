import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface BalanceListItem {
  account: any // BankAccount | DigitalWallet
  company: {
    id: number
    tradingName: string
    legalName: string
    logo: string
  }
  initialBalance: number
  transactionBalance: number
  finalBalance: number
  incomingAmount: number
  outgoingAmount: number
  currency: string
  lastTransactionDate?: string
}

export interface BalanceListResponse {
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
  responseTime: number
  cached: boolean
}

export interface BalanceListParams {
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

/**
 * Simple in-memory cache for SSR data
 * Prevents duplicate queries during the same request
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()
  
  set<T>(key: string, data: T, ttlMs: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance for the server
const ssrCache = new SimpleCache()

// Cleanup expired entries every 5 minutes
setInterval(() => ssrCache.cleanup(), 5 * 60 * 1000)

/**
 * Direct database service for Balances SSR
 * Bypasses HTTP API routes for better performance during server-side rendering
 * 
 * Performance improvements:
 * - No HTTP round-trip overhead
 * - Direct database access for initial balances
 * - Optimized queries with proper indexing
 * - In-memory caching for duplicate requests
 */
export class BalanceSSRService {
  /**
   * Get balances with calculated values for list view
   * Used during SSR for fast initial page load
   */
  static async getBalancesForSSR(params: BalanceListParams = {}): Promise<BalanceListResponse> {
    const startTime = Date.now()
    
    // Default parameters optimized for SSR
    const {
      company = 'all',
      accountType = 'all',
      search = '',
      showZeroBalances = true,
      viewFilter = 'all',
      groupBy = 'account',
      selectedPeriod = 'thisMonth',
      startDate = '',
      endDate = '',
      sortField = 'finalBalance',
      sortDirection = 'desc'
    } = params

    // Generate cache key for this specific query
    const cacheKey = `balances:${company}:${accountType}:${search}:${showZeroBalances}:${viewFilter}:${groupBy}:${selectedPeriod}:${startDate}:${endDate}:${sortField}:${sortDirection}`
    
    // Check cache first (30 second TTL for SSR)
    const cachedResult = ssrCache.get<BalanceListResponse>(cacheKey)
    if (cachedResult) {
      return {
        ...cachedResult,
        cached: true,
        responseTime: Date.now() - startTime
      }
    }

    try {
      // Get all accounts directly from database (server-side safe)
      const bankAccountsWhere: Prisma.BankAccountWhereInput = {}
      const digitalWalletsWhere: Prisma.DigitalWalletWhereInput = {}
      
      if (company !== 'all') {
        bankAccountsWhere.companyId = company as number
        digitalWalletsWhere.companyId = company as number
      }

      const [bankAccounts, digitalWallets] = await Promise.all([
        prisma.bankAccount.findMany({
          where: bankAccountsWhere,
          include: {
            company: {
              select: {
                id: true,
                tradingName: true,
                legalName: true,
                logo: true,
              },
            },
          },
        }),
        prisma.digitalWallet.findMany({
          where: digitalWalletsWhere,
          include: {
            company: {
              select: {
                id: true,
                tradingName: true,
                legalName: true,
                logo: true,
              },
            },
          },
        })
      ])

      // Combine accounts with type metadata for easier identification
      const allAccounts = [
        ...bankAccounts.map(account => ({ ...account, __accountType: 'bank' as const })),
        ...digitalWallets.map(account => ({ ...account, __accountType: 'wallet' as const }))
      ]

      // Get initial balances from database
      const initialBalancesWhere: Prisma.InitialBalanceWhereInput = {}
      if (company !== 'all') {
        initialBalancesWhere.companyId = company as number
      }

      const initialBalances = await prisma.initialBalance.findMany({
        where: initialBalancesWhere,
        include: {
          company: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
              logo: true,
            },
          },
        },
      })

      // Calculate balances for each account
      const accountBalances = await Promise.all(
        allAccounts.map(async (account) => {
          const accountType = account.__accountType
          
          // Find corresponding initial balance
          const initialBalance = initialBalances.find(
            ib => ib.accountId === account.id && ib.accountType === accountType
          )

          // Calculate transaction balance for the period
          const transactionData = await this.calculateTransactionBalanceDetailed(
            account.id,
            accountType,
            account.companyId,
            selectedPeriod,
            { startDate, endDate }
          )

          const initialAmount = initialBalance?.amount || 0
          const finalBalance = initialAmount + transactionData.netAmount

          return {
            account,
            company: initialBalance?.company || account.company || {
              id: account.companyId,
              tradingName: 'Unknown Company',
              legalName: 'Unknown Company',
              logo: ''
            },
            initialBalance: initialAmount,
            transactionBalance: transactionData.netAmount,
            finalBalance,
            incomingAmount: transactionData.totalIncoming,
            outgoingAmount: transactionData.totalOutgoing,
            currency: account.currency,
            lastTransactionDate: await this.getLastTransactionDate(account.id, accountType)
          }
        })
      )

      // Apply filters
      let filteredBalances = this.applyFilters(accountBalances, {
        accountType,
        search,
        showZeroBalances,
        viewFilter
      })

      // Sort balances
      filteredBalances = this.sortBalances(filteredBalances, sortField, sortDirection)

      // Calculate summary statistics
      const summary = this.calculateSummary(filteredBalances)

      const responseTime = Date.now() - startTime

      const result: BalanceListResponse = {
        data: filteredBalances,
        summary,
        filters: {
          selectedPeriod,
          customDateRange: { startDate, endDate },
          accountTypeFilter: accountType,
          viewFilter,
          groupBy,
          searchTerm: search,
          showZeroBalances
        },
        responseTime,
        cached: false,
      }

      // Cache the result for 30 seconds (good for SSR performance without stale data)
      ssrCache.set(cacheKey, result, 30000)

      return result

    } catch (error) {
      console.error('BalanceSSRService error:', error)
      throw new Error('Failed to fetch balances for SSR')
    }
  }

  /**
   * Calculate detailed transaction balance for specific account and period
   * Server-side version using database queries
   */
  private static async calculateTransactionBalanceDetailed(
    accountId: string,
    accountType: 'bank' | 'wallet',
    companyId: number,
    period: string,
    customRange: { startDate: string; endDate: string }
  ): Promise<{ netAmount: number; totalIncoming: number; totalOutgoing: number }> {
    try {
      // Build where clause for transactions
      const where: Prisma.TransactionWhereInput = {
        accountId,
        accountType,
        companyId
      }

      // Add period filtering
      if (period !== 'allTime') {
        const now = new Date()
        let startDate: Date
        
        switch (period) {
          case 'thisMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case 'lastMonth':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
            where.date = { gte: startDate, lte: endDate }
            break
          case 'thisYear':
            startDate = new Date(now.getFullYear(), 0, 1)
            where.date = { gte: startDate }
            break
          case 'lastYear':
            startDate = new Date(now.getFullYear() - 1, 0, 1)
            const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31)
            where.date = { gte: startDate, lte: endOfLastYear }
            break
          case 'custom':
            if (customRange.startDate && customRange.endDate) {
              where.date = { 
                gte: new Date(customRange.startDate), 
                lte: new Date(customRange.endDate) 
              }
            }
            break
          default:
            where.date = { gte: startDate }
        }
      }

      // Get aggregated transaction data
      const result = await prisma.transaction.aggregate({
        where,
        _sum: {
          netAmount: true,
          incomingAmount: true,
          outgoingAmount: true,
        },
      })

      return {
        netAmount: result._sum.netAmount || 0,
        totalIncoming: result._sum.incomingAmount || 0,
        totalOutgoing: result._sum.outgoingAmount || 0
      }
    } catch (error) {
      console.error('Error calculating transaction balance:', error)
      return {
        netAmount: 0,
        totalIncoming: 0,
        totalOutgoing: 0
      }
    }
  }

  /**
   * Get last transaction date for an account
   * Server-side version using database queries
   */
  private static async getLastTransactionDate(accountId: string, accountType: 'bank' | 'wallet'): Promise<string | undefined> {
    try {
      const lastTransaction = await prisma.transaction.findFirst({
        where: {
          accountId,
          accountType,
        },
        orderBy: {
          date: 'desc',
        },
        select: {
          date: true,
        },
      })

      return lastTransaction?.date.toISOString()
    } catch (error) {
      console.error('Error getting last transaction date:', error)
      return undefined
    }
  }

  /**
   * Apply filters to balance list
   */
  private static applyFilters(
    balances: BalanceListItem[], 
    filters: { 
      accountType: string; 
      search: string; 
      showZeroBalances: boolean; 
      viewFilter: string 
    }
  ): BalanceListItem[] {
    let filtered = [...balances]

    // Account type filter
    if (filters.accountType !== 'all') {
      filtered = filtered.filter(balance => {
        const isBank = balance.account.__accountType === 'bank'
        return filters.accountType === 'banks' ? isBank : !isBank
      })
    }

    // View filter (assets/liabilities)
    if (filters.viewFilter !== 'all') {
      filtered = filtered.filter(balance => {
        switch (filters.viewFilter) {
          case 'assets':
            return balance.finalBalance >= 0
          case 'liabilities':
            return balance.finalBalance < 0
          case 'equity':
            return balance.finalBalance >= 0
          default:
            return true
        }
      })
    }

    // Search term filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(balance => {
        const account = balance.account
        const company = balance.company
        
        const accountName = account.__accountType === 'bank' 
          ? (account.accountName || account.bankName) 
          : account.walletName;
          
        return (
          accountName?.toLowerCase().includes(searchLower) ||
          company.tradingName.toLowerCase().includes(searchLower) ||
          account.currency.toLowerCase().includes(searchLower) ||
          ('accountNumber' in account && account.accountNumber?.toLowerCase().includes(searchLower)) ||
          ('bankName' in account && account.bankName?.toLowerCase().includes(searchLower))
        )
      })
    }

    // Zero balances filter
    if (!filters.showZeroBalances) {
      filtered = filtered.filter(balance => Math.abs(balance.finalBalance) > 0.01)
    }

    return filtered
  }

  /**
   * Sort balances by specified field and direction
   */
  private static sortBalances(
    balances: BalanceListItem[], 
    sortField: string, 
    sortDirection: string
  ): BalanceListItem[] {
    return balances.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case 'accountName':
          aValue = a.account.__accountType === 'bank' 
            ? (a.account.accountName || a.account.bankName) 
            : a.account.walletName;
          bValue = b.account.__accountType === 'bank' 
            ? (b.account.accountName || b.account.bankName) 
            : b.account.walletName;
          break
        case 'companyName':
          aValue = a.company.tradingName
          bValue = b.company.tradingName
          break
        case 'finalBalance':
          aValue = a.finalBalance
          bValue = b.finalBalance
          break
        case 'currency':
          aValue = a.currency
          bValue = b.currency
          break
        default:
          aValue = a.finalBalance
          bValue = b.finalBalance
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
    })
  }

  /**
   * Calculate summary statistics
   */
  private static calculateSummary(balances: BalanceListItem[]) {
    return {
      totalAssets: balances.reduce((sum, b) => sum + (b.finalBalance >= 0 ? b.finalBalance : 0), 0),
      totalLiabilities: balances.reduce((sum, b) => sum + (b.finalBalance < 0 ? Math.abs(b.finalBalance) : 0), 0),
      netWorth: balances.reduce((sum, b) => sum + b.finalBalance, 0),
      accountCount: balances.length,
      bankAccountCount: balances.filter(b => b.account.__accountType === 'bank').length,
      walletCount: balances.filter(b => b.account.__accountType === 'wallet').length,
      currencyBreakdown: balances.reduce((breakdown, balance) => {
        const currency = balance.currency
        if (!breakdown[currency]) {
          breakdown[currency] = { assets: 0, liabilities: 0, netWorth: 0 }
        }

        if (balance.finalBalance >= 0) {
          breakdown[currency].assets += balance.finalBalance
        } else {
          breakdown[currency].liabilities += Math.abs(balance.finalBalance)
        }
        breakdown[currency].netWorth += balance.finalBalance

        return breakdown
      }, {} as Record<string, { assets: number; liabilities: number; netWorth: number }>)
    }
  }
}