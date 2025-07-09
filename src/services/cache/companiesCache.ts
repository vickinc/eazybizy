import { Company } from '@/types/company.types'

/**
 * Simple in-memory cache for companies data
 * This bridges the gap between async API calls and synchronous business logic
 */
class CompaniesCacheService {
  private companies: Company[] = []
  private lastFetch: number = 0
  private readonly CACHE_DURATION = 500 // 0.5 seconds for near-immediate updates

  /**
   * Set companies in cache (called by the useCompanies hook)
   */
  setCompanies(companies: Company[]): void {
    this.companies = [...companies]
    this.lastFetch = Date.now()
  }

  /**
   * Get companies from cache (for use in business services)
   */
  getCompanies(): Company[] {
    return [...this.companies]
  }

  /**
   * Check if cache is fresh
   */
  isFresh(): boolean {
    return Date.now() - this.lastFetch < this.CACHE_DURATION
  }

  /**
   * Get a specific company by ID
   */
  getCompanyById(id: number): Company | undefined {
    return this.companies.find(company => company.id === id)
  }

  /**
   * Get active companies
   */
  getActiveCompanies(): Company[] {
    return this.companies.filter(company => company.status === 'Active')
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.companies = []
    this.lastFetch = 0
  }

  /**
   * Check if cache has data
   */
  hasData(): boolean {
    return this.companies.length > 0
  }
}

// Export singleton instance
export const companiesCache = new CompaniesCacheService()