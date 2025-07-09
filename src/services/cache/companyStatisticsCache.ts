interface CompanyStatistics {
  totalActive: number
  totalPassive: number
  byIndustry: Record<string, number>
  newThisMonth: number
  lastUpdated: Date
}

class CompanyStatisticsCache {
  private cache: CompanyStatistics | null = null
  private readonly TTL_MS = 5 * 60 * 1000 // 5 minutes cache TTL
  private isRefreshing = false

  /**
   * Get cached statistics if valid, otherwise return null
   */
  get(): CompanyStatistics | null {
    if (!this.cache) return null
    
    const isExpired = Date.now() - this.cache.lastUpdated.getTime() > this.TTL_MS
    if (isExpired) {
      return null
    }
    
    return this.cache
  }

  /**
   * Set statistics in cache
   */
  set(statistics: Omit<CompanyStatistics, 'lastUpdated'>): void {
    this.cache = {
      ...statistics,
      lastUpdated: new Date()
    }
    this.isRefreshing = false
  }

  /**
   * Clear the cache (call after company mutations)
   */
  clear(): void {
    this.cache = null
    this.isRefreshing = false
  }

  /**
   * Check if cache is currently being refreshed
   */
  isCurrentlyRefreshing(): boolean {
    return this.isRefreshing
  }

  /**
   * Mark cache as being refreshed to prevent duplicate requests
   */
  markAsRefreshing(): void {
    this.isRefreshing = true
  }

  /**
   * Get cache info for debugging
   */
  getInfo(): { cached: boolean; age?: number; refreshing: boolean } {
    if (!this.cache) {
      return { cached: false, refreshing: this.isRefreshing }
    }

    const ageMs = Date.now() - this.cache.lastUpdated.getTime()
    return {
      cached: true,
      age: Math.floor(ageMs / 1000), // age in seconds
      refreshing: this.isRefreshing
    }
  }
}

// Export singleton instance
export const companyStatisticsCache = new CompanyStatisticsCache()

/**
 * Background statistics refresh utility
 * Call this after any company mutations to ensure fresh stats
 */
export async function invalidateCompanyStatistics(): Promise<void> {
  companyStatisticsCache.clear()
  
  // Optionally trigger background refresh here
  // This could be enhanced with a queue system for high-throughput scenarios
}

/**
 * Manual statistics refresh
 * Useful for warming the cache or forcing an update
 */
export async function refreshCompanyStatistics(): Promise<CompanyStatistics | null> {
  // Prevent duplicate refreshes
  if (companyStatisticsCache.isCurrentlyRefreshing()) {
    return companyStatisticsCache.get()
  }

  try {
    companyStatisticsCache.markAsRefreshing()
    
    // Fetch fresh statistics from the API
    const response = await fetch('/api/companies/statistics')
    if (!response.ok) {
      throw new Error('Failed to fetch statistics')
    }
    
    const statistics = await response.json()
    companyStatisticsCache.set(statistics)
    
    return companyStatisticsCache.get()
  } catch (error) {
    console.error('Failed to refresh company statistics:', error)
    companyStatisticsCache.isRefreshing = false
    return null
  }
}