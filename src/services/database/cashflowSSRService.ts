import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis'

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
  
  // Clean up expired entries periodically
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

// Clean up cache every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => ssrCache.cleanup(), 5 * 60 * 1000)
}

export interface ManualCashflowEntryWithCompany {
  id: string
  companyId: number
  accountId: string
  accountType: string
  type: string
  amount: number
  currency: string
  period: string
  description: string
  notes: string | null
  createdAt: Date
  updatedAt: Date
  company: {
    id: number
    tradingName: string
    legalName: string
    logo: string
  }
}

export interface CashflowFilters {
  companyId?: number | 'all'
  accountId?: string
  accountType?: 'bank' | 'wallet'
  type?: 'inflow' | 'outflow'
  period?: string
  periodFrom?: string
  periodTo?: string
  searchTerm?: string
}

export interface CashflowPagination {
  skip?: number
  take?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export class CashflowSSRService {
  /**
   * Get manual cashflow entries with filters and pagination
   */
  static async getManualCashflowEntries(
    filters: CashflowFilters = {},
    pagination: CashflowPagination = {}
  ): Promise<{ data: ManualCashflowEntryWithCompany[]; total: number; cached: boolean; responseTime: number }> {
    const startTime = Date.now()
    const {
      companyId,
      accountId,
      accountType,
      type,
      period,
      periodFrom,
      periodTo,
      searchTerm
    } = filters

    const {
      skip = 0,
      take = 1000,
      sortField = 'createdAt',
      sortDirection = 'desc'
    } = pagination

    // Create cache key
    const cacheKey = CacheKeys.cashflow.list({ filters, pagination })
    
    // Check Redis cache first
    const cached = await CacheService.get<{ data: ManualCashflowEntryWithCompany[]; total: number }>(cacheKey)
    if (cached) {
      return {
        ...cached,
        cached: true,
        responseTime: Date.now() - startTime
      }
    }

    // Check in-memory cache for SSR
    const ssrCached = ssrCache.get<{ data: ManualCashflowEntryWithCompany[]; total: number }>(cacheKey)
    if (ssrCached) {
      return {
        ...ssrCached,
        cached: true,
        responseTime: Date.now() - startTime
      }
    }

    try {
      // Build where clause
      const where: Prisma.ManualCashflowEntryWhereInput = {}

      // Company filter
      if (companyId && companyId !== 'all') {
        where.companyId = companyId
      }

      // Account filter
      if (accountId) {
        where.accountId = accountId
      }

      // Account type filter
      if (accountType) {
        where.accountType = accountType
      }

      // Type filter
      if (type) {
        where.type = type
      }

      // Period filters
      if (period) {
        where.period = period
      } else if (periodFrom || periodTo) {
        where.period = {}
        if (periodFrom) {
          where.period.gte = periodFrom
        }
        if (periodTo) {
          where.period.lte = periodTo
        }
      }

      // Search filter
      if (searchTerm) {
        where.OR = [
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { notes: { contains: searchTerm, mode: 'insensitive' } }
        ]
      }

      // Execute query with pagination
      const [data, total] = await Promise.all([
        prisma.manualCashflowEntry.findMany({
          where,
          skip,
          take,
          orderBy: {
            [sortField]: sortDirection
          },
          include: {
            company: {
              select: {
                id: true,
                tradingName: true,
                legalName: true,
                logo: true
              }
            }
          }
        }),
        prisma.manualCashflowEntry.count({ where })
      ])

      const result = { 
        data, 
        total,
        cached: false,
        responseTime: Date.now() - startTime
      }
      
      // Cache the result in Redis
      await CacheService.set(cacheKey, { data, total }, CacheTTL.cashflow.list)
      
      // Cache in memory for SSR
      ssrCache.set(cacheKey, { data, total }, 30000) // 30 seconds TTL
      
      return result
    } catch (error) {
      console.error('Error fetching manual cashflow entries:', error)
      throw error
    }
  }

  /**
   * Get a single manual cashflow entry by ID
   */
  static async getManualCashflowEntryById(
    id: string
  ): Promise<ManualCashflowEntryWithCompany | null> {
    const cacheKey = `cashflow:entry:${id}`
    
    // Check cache first
    const cached = cache.get<ManualCashflowEntryWithCompany>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const entry = await prisma.manualCashflowEntry.findUnique({
        where: { id },
        include: {
          company: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
              logo: true
            }
          }
        }
      })

      if (entry) {
        // Cache the result
        cache.set(cacheKey, entry, 30000) // 30 seconds TTL
      }

      return entry
    } catch (error) {
      console.error('Error fetching manual cashflow entry:', error)
      throw error
    }
  }

  /**
   * Create a new manual cashflow entry
   */
  static async createManualCashflowEntry(
    data: Prisma.ManualCashflowEntryCreateInput
  ): Promise<ManualCashflowEntryWithCompany> {
    try {
      const entry = await prisma.manualCashflowEntry.create({
        data,
        include: {
          company: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
              logo: true
            }
          }
        }
      })

      // Clear cache
      cache.clear()

      return entry
    } catch (error) {
      console.error('Error creating manual cashflow entry:', error)
      throw error
    }
  }

  /**
   * Update a manual cashflow entry
   */
  static async updateManualCashflowEntry(
    id: string,
    data: Prisma.ManualCashflowEntryUpdateInput
  ): Promise<ManualCashflowEntryWithCompany> {
    try {
      const entry = await prisma.manualCashflowEntry.update({
        where: { id },
        data,
        include: {
          company: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
              logo: true
            }
          }
        }
      })

      // Clear cache
      cache.clear()

      return entry
    } catch (error) {
      console.error('Error updating manual cashflow entry:', error)
      throw error
    }
  }

  /**
   * Delete a manual cashflow entry
   */
  static async deleteManualCashflowEntry(id: string): Promise<void> {
    try {
      await prisma.manualCashflowEntry.delete({
        where: { id }
      })

      // Clear cache
      cache.clear()
    } catch (error) {
      console.error('Error deleting manual cashflow entry:', error)
      throw error
    }
  }

  /**
   * Get cashflow summary statistics
   */
  static async getCashflowSummary(
    filters: CashflowFilters = {}
  ): Promise<{
    totalEntries: number
    totalInflow: number
    totalOutflow: number
    netCashflow: number
    byPeriod: Array<{
      period: string
      inflow: number
      outflow: number
      net: number
    }>
    cached: boolean
    responseTime: number
  }> {
    const startTime = Date.now()
    const cacheKey = CacheKeys.cashflow.summary(filters)
    
    // Check Redis cache first
    const cached = await CacheService.get<any>(cacheKey)
    if (cached) {
      return {
        ...cached,
        cached: true,
        responseTime: Date.now() - startTime
      }
    }

    // Check in-memory cache for SSR
    const ssrCached = ssrCache.get<any>(cacheKey)
    if (ssrCached) {
      return {
        ...ssrCached,
        cached: true,
        responseTime: Date.now() - startTime
      }
    }

    try {
      const where: Prisma.ManualCashflowEntryWhereInput = {}

      // Apply filters
      if (filters.companyId && filters.companyId !== 'all') {
        where.companyId = filters.companyId
      }
      if (filters.accountId) {
        where.accountId = filters.accountId
      }
      if (filters.accountType) {
        where.accountType = filters.accountType
      }
      if (filters.period) {
        where.period = filters.period
      } else if (filters.periodFrom || filters.periodTo) {
        where.period = {}
        if (filters.periodFrom) {
          where.period.gte = filters.periodFrom
        }
        if (filters.periodTo) {
          where.period.lte = filters.periodTo
        }
      }

      // Get all entries for aggregation
      const entries = await prisma.manualCashflowEntry.findMany({
        where,
        select: {
          type: true,
          amount: true,
          period: true
        }
      })

      // Calculate totals
      let totalInflow = 0
      let totalOutflow = 0
      const periodMap = new Map<string, { inflow: number; outflow: number }>()

      entries.forEach(entry => {
        if (entry.type === 'inflow') {
          totalInflow += entry.amount
        } else {
          totalOutflow += entry.amount
        }

        // Aggregate by period
        const periodData = periodMap.get(entry.period) || { inflow: 0, outflow: 0 }
        if (entry.type === 'inflow') {
          periodData.inflow += entry.amount
        } else {
          periodData.outflow += entry.amount
        }
        periodMap.set(entry.period, periodData)
      })

      // Convert period map to array
      const byPeriod = Array.from(periodMap.entries())
        .map(([period, data]) => ({
          period,
          inflow: data.inflow,
          outflow: data.outflow,
          net: data.inflow - data.outflow
        }))
        .sort((a, b) => b.period.localeCompare(a.period))

      const result = {
        totalEntries: entries.length,
        totalInflow,
        totalOutflow,
        netCashflow: totalInflow - totalOutflow,
        byPeriod,
        cached: false,
        responseTime: Date.now() - startTime
      }

      // Cache the result in Redis
      await CacheService.set(cacheKey, {
        totalEntries: entries.length,
        totalInflow,
        totalOutflow,
        netCashflow: totalInflow - totalOutflow,
        byPeriod
      }, CacheTTL.cashflow.summary)

      // Cache in memory for SSR
      ssrCache.set(cacheKey, {
        totalEntries: entries.length,
        totalInflow,
        totalOutflow,
        netCashflow: totalInflow - totalOutflow,
        byPeriod
      }, 30000) // 30 seconds TTL

      return result
    } catch (error) {
      console.error('Error calculating cashflow summary:', error)
      throw error
    }
  }

  /**
   * Get all cash flow data for SSR (transactions, accounts, manual entries)
   */
  static async getCashflowDataForSSR(params: {
    companyId?: number | 'all'
    take?: number
    period?: string
    periodFrom?: string
    periodTo?: string
  }): Promise<{
    transactions: any[]
    bankAccounts: any[]
    digitalWallets: any[]
    manualEntries: ManualCashflowEntryWithCompany[]
    summary: any
    cached: boolean
    responseTime: number
  }> {
    const startTime = Date.now()
    const { companyId = 'all', take = 20, period, periodFrom, periodTo } = params
    
    // Create cache key for the complete dataset
    const cacheKey = CacheKeys.cashflow.summary(params)
    
    // Check Redis cache first
    const cached = await CacheService.get<any>(cacheKey)
    if (cached) {
      return {
        ...cached,
        cached: true,
        responseTime: Date.now() - startTime
      }
    }

    // Check in-memory cache for SSR
    const ssrCached = ssrCache.get<any>(cacheKey)
    if (ssrCached) {
      return {
        ...ssrCached,
        cached: true,
        responseTime: Date.now() - startTime
      }
    }

    try {
      // Build common where clause for company filter
      const companyWhere = companyId === 'all' ? {} : { companyId }
      
      // Build date filter for transactions (they use 'date' field, not 'period')
      const transactionDateFilter: any = {}
      if (periodFrom || periodTo) {
        if (periodFrom) transactionDateFilter.gte = new Date(periodFrom)
        if (periodTo) transactionDateFilter.lte = new Date(periodTo)
      }

      // Fetch all data in parallel
      const [transactions, bankAccounts, digitalWallets, manualEntries] = await Promise.all([
        // Get transactions
        prisma.transaction.findMany({
          where: {
            ...companyWhere,
            isDeleted: false,
            ...(Object.keys(transactionDateFilter).length > 0 && { date: transactionDateFilter })
          },
          take,
          orderBy: { date: 'desc' },
          include: {
            company: {
              select: {
                id: true,
                tradingName: true,
                legalName: true,
                logo: true
              }
            }
          }
        }),
        
        // Get bank accounts
        prisma.bankAccount.findMany({
          where: {
            ...companyWhere,
            isActive: true
          },
          include: {
            company: {
              select: {
                id: true,
                tradingName: true,
                legalName: true,
                logo: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }),
        
        // Get digital wallets
        prisma.digitalWallet.findMany({
          where: {
            ...companyWhere,
            isActive: true
          },
          include: {
            company: {
              select: {
                id: true,
                tradingName: true,
                legalName: true,
                logo: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }),
        
        // Get manual entries
        this.getManualCashflowEntries(
          { companyId, period, periodFrom, periodTo },
          { take, sortField: 'createdAt', sortDirection: 'desc' }
        )
      ])

      // Calculate summary
      const summary = await this.getCashflowSummary({ companyId, period, periodFrom, periodTo })

      const result = {
        transactions,
        bankAccounts,
        digitalWallets,
        manualEntries: manualEntries.data,
        summary,
        cached: false,
        responseTime: Date.now() - startTime
      }

      // Cache the result in Redis
      await CacheService.set(cacheKey, {
        transactions,
        bankAccounts,
        digitalWallets,
        manualEntries: manualEntries.data,
        summary
      }, CacheTTL.cashflow.summary)
      
      // Cache in memory for SSR
      ssrCache.set(cacheKey, {
        transactions,
        bankAccounts,
        digitalWallets,
        manualEntries: manualEntries.data,
        summary
      }, 30000) // 30 seconds TTL

      return result
    } catch (error) {
      console.error('Error fetching cashflow data for SSR:', error)
      throw error
    }
  }

  /**
   * Intelligent cache warming for common cashflow query patterns
   */
  static async warmCashflowCache(companyId: number | 'all' = 'all'): Promise<void> {
    const startTime = Date.now()
    console.log(`[CashflowSSRService] Starting cache warming for company ${companyId}...`)

    try {
      // Common time periods users typically view
      const currentDate = new Date()
      const periods = [
        {
          name: 'thisMonth',
          period: currentDate.toISOString().slice(0, 7)
        },
        {
          name: 'lastMonth',
          period: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString().slice(0, 7)
        },
        {
          name: 'thisYear',
          periodFrom: new Date(currentDate.getFullYear(), 0, 1).toISOString(),
          periodTo: currentDate.toISOString()
        },
        {
          name: 'lastYear',
          periodFrom: new Date(currentDate.getFullYear() - 1, 0, 1).toISOString(),
          periodTo: new Date(currentDate.getFullYear() - 1, 11, 31).toISOString()
        }
      ]

      // Warm cache for each period in parallel
      const cacheWarmingPromises = periods.map(async (periodConfig) => {
        try {
          await this.getCashflowDataForSSR({
            companyId,
            take: 30,
            ...periodConfig
          })
          console.log(`[CashflowSSRService] Cache warmed for ${periodConfig.name}`)
        } catch (error) {
          console.warn(`[CashflowSSRService] Cache warming failed for ${periodConfig.name}:`, error)
        }
      })

      // Also warm cache for different company filters if looking at all companies
      if (companyId === 'all') {
        // Get top 5 most active companies for individual caching
        const topCompanies = await prisma.company.findMany({
          where: { status: 'Active' },
          take: 5,
          orderBy: { updatedAt: 'desc' }
        })

        const companyWarmingPromises = topCompanies.map(async (company) => {
          try {
            await this.getCashflowDataForSSR({
              companyId: company.id,
              take: 20,
              period: currentDate.toISOString().slice(0, 7) // Current month
            })
            console.log(`[CashflowSSRService] Cache warmed for company ${company.tradingName}`)
          } catch (error) {
            console.warn(`[CashflowSSRService] Cache warming failed for company ${company.tradingName}:`, error)
          }
        })

        cacheWarmingPromises.push(...companyWarmingPromises)
      }

      await Promise.allSettled(cacheWarmingPromises)
      
      console.log(`[CashflowSSRService] Cache warming completed in ${Date.now() - startTime}ms`)
    } catch (error) {
      console.error('[CashflowSSRService] Cache warming failed:', error)
    }
  }

  /**
   * Get optimized cashflow data with predictive caching
   */
  static async getOptimizedCashflowData(params: {
    companyId?: number | 'all'
    take?: number
    period?: string
    periodFrom?: string
    periodTo?: string
    enablePredictiveCaching?: boolean
  }): Promise<{
    transactions: any[]
    bankAccounts: any[]
    digitalWallets: any[]
    manualEntries: ManualCashflowEntryWithCompany[]
    summary: any
    cached: boolean
    responseTime: number
    predictiveCacheHits?: number
  }> {
    const { enablePredictiveCaching = true, ...dataParams } = params
    const startTime = Date.now()

    // Get the main data
    const result = await this.getCashflowDataForSSR(dataParams)

    // If predictive caching is enabled, warm related queries in the background
    if (enablePredictiveCaching && !result.cached) {
      // Don't await this - let it run in background
      this.warmRelatedCaches(dataParams).catch(error => {
        console.warn('[CashflowSSRService] Background cache warming failed:', error)
      })
    }

    return {
      ...result,
      responseTime: Date.now() - startTime
    }
  }

  /**
   * Warm caches for related queries based on current query pattern
   */
  private static async warmRelatedCaches(params: {
    companyId?: number | 'all'
    take?: number
    period?: string
    periodFrom?: string
    periodTo?: string
  }): Promise<void> {
    const { companyId, take = 20 } = params

    // Predictive queries based on user behavior patterns
    const relatedQueries = []

    // If viewing all companies, warm individual company caches
    if (companyId === 'all') {
      relatedQueries.push(
        // Warm cache for most recent companies
        prisma.company.findMany({
          where: { status: 'Active' },
          take: 3,
          orderBy: { updatedAt: 'desc' }
        }).then(companies => 
          Promise.allSettled(
            companies.map(company => 
              this.getCashflowDataForSSR({
                companyId: company.id,
                take: Math.min(take, 15),
                period: params.period,
                periodFrom: params.periodFrom,
                periodTo: params.periodTo
              })
            )
          )
        )
      )
    }

    // If viewing specific period, warm adjacent periods
    if (params.period) {
      const currentPeriod = new Date(params.period + '-01')
      const prevMonth = new Date(currentPeriod)
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      const nextMonth = new Date(currentPeriod)
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      relatedQueries.push(
        this.getCashflowDataForSSR({
          companyId,
          take: Math.min(take, 15),
          period: prevMonth.toISOString().slice(0, 7)
        }),
        this.getCashflowDataForSSR({
          companyId,
          take: Math.min(take, 15),
          period: nextMonth.toISOString().slice(0, 7)
        })
      )
    }

    // Warm summary-only queries for different filter combinations
    relatedQueries.push(
      this.getCashflowSummary({
        companyId,
        period: params.period,
        periodFrom: params.periodFrom,
        periodTo: params.periodTo
      })
    )

    await Promise.allSettled(relatedQueries)
  }

  /**
   * Batch fetch multiple cashflow datasets efficiently
   */
  static async batchGetCashflowData(
    requests: Array<{
      companyId?: number | 'all'
      take?: number
      period?: string
      periodFrom?: string
      periodTo?: string
    }>
  ): Promise<Array<{
    transactions: any[]
    bankAccounts: any[]
    digitalWallets: any[]
    manualEntries: ManualCashflowEntryWithCompany[]
    summary: any
    cached: boolean
    responseTime: number
  }>> {
    const startTime = Date.now()
    
    // Execute all requests in parallel for maximum efficiency
    const results = await Promise.allSettled(
      requests.map(request => this.getCashflowDataForSSR(request))
    )

    console.log(`[CashflowSSRService] Batch fetch completed in ${Date.now() - startTime}ms for ${requests.length} requests`)

    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : {
            transactions: [],
            bankAccounts: [],
            digitalWallets: [],
            manualEntries: [],
            summary: { totalEntries: 0, totalInflow: 0, totalOutflow: 0, netCashflow: 0, byPeriod: [] },
            cached: false,
            responseTime: Date.now() - startTime
          }
    )
  }

  /**
   * Clear the cache (useful for testing or manual cache invalidation)
   */
  static clearCache(): void {
    ssrCache.clear()
  }
}