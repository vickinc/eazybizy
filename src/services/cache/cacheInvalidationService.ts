import { CacheService, CacheKeys } from '@/lib/redis'

export class CacheInvalidationService {
  /**
   * Invalidate all company-related caches
   */
  static async invalidateCompanies(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('companies:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate company caches:', error)
      return 0
    }
  }

  /**
   * Invalidate company list caches (when filters change)
   */
  static async invalidateCompanyLists(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('companies:list:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate company list caches:', error)
      return 0
    }
  }

  /**
   * Invalidate specific company cache
   */
  static async invalidateCompany(companyId: string | number): Promise<boolean> {
    try {
      const cacheKey = CacheKeys.companies.item(companyId)
      await CacheService.del(cacheKey)
      return true
    } catch (error) {
      console.error(`Failed to invalidate cache for company ${companyId}:`, error)
      return false
    }
  }

  /**
   * Invalidate company statistics
   */
  static async invalidateCompanyStats(): Promise<boolean> {
    try {
      const cacheKey = CacheKeys.companies.stats()
      await CacheService.del(cacheKey)
      return true
    } catch (error) {
      console.error('Failed to invalidate company statistics cache:', error)
      return false
    }
  }

  /**
   * Invalidate search-related caches
   */
  static async invalidateSearchCaches(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('companies:search:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate search caches:', error)
      return 0
    }
  }

  /**
   * Invalidate count caches
   */
  static async invalidateCountCaches(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('companies:count:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate count caches:', error)
      return 0
    }
  }

  /**
   * Smart invalidation for company mutations
   * Invalidates related caches when a company is created/updated/deleted
   */
  static async invalidateOnCompanyMutation(companyId?: string | number): Promise<void> {
    try {
      
      // Invalidate specific company if ID provided
      if (companyId) {
        await this.invalidateCompany(companyId)
      }

      // Invalidate aggregated data that depends on company changes
      await Promise.all([
        this.invalidateCompanyLists(),
        this.invalidateCompanyStats(),
        this.invalidateCountCaches(),
        this.invalidateSearchCaches(),
      ])

    } catch (error) {
      console.error('Smart invalidation failed:', error)
    }
  }

  /**
   * Invalidate all calendar-related caches
   */
  static async invalidateCalendar(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('calendar:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate calendar caches:', error)
      return 0
    }
  }

  /**
   * Invalidate all notes-related caches
   */
  static async invalidateNotes(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('notes:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate notes caches:', error)
      return 0
    }
  }

  /**
   * Invalidate all business cards-related caches
   */
  static async invalidateBusinessCards(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('business-cards:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate business cards caches:', error)
      return 0
    }
  }

  /**
   * Invalidate business cards list caches
   */
  static async invalidateBusinessCardLists(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('business-cards:list:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate business cards list caches:', error)
      return 0
    }
  }

  /**
   * Invalidate specific business card cache
   */
  static async invalidateBusinessCard(cardId: string | number): Promise<boolean> {
    try {
      const cacheKey = CacheKeys.businessCards.item(cardId)
      await CacheService.del(cacheKey)
      return true
    } catch (error) {
      console.error(`Failed to invalidate cache for business card ${cardId}:`, error)
      return false
    }
  }

  /**
   * Smart invalidation for business card mutations
   * Invalidates related caches when a business card is created/updated/deleted
   */
  static async invalidateOnBusinessCardMutation(cardId?: string | number, companyId?: string | number): Promise<void> {
    try {
      
      // Invalidate specific business card if ID provided
      if (cardId) {
        await this.invalidateBusinessCard(cardId)
      }

      // Invalidate business card lists and stats
      await Promise.all([
        this.invalidateBusinessCardLists(),
        CacheService.delPattern('business-cards:count:*'),
        CacheService.delPattern('business-cards:stats:*'),
      ])

      // If related to a company, also invalidate company-related caches
      if (companyId) {
        await this.invalidateOnCompanyMutation(companyId)
      }

    } catch (error) {
      console.error('Smart invalidation failed for business cards:', error)
    }
  }

  /**
   * Invalidate all products-related caches
   */
  static async invalidateProducts(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('products:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate products caches:', error)
      return 0
    }
  }

  /**
   * Smart invalidation for product mutations
   */
  static async invalidateOnProductMutation(productId?: string | number, companyId?: string | number): Promise<void> {
    try {
      
      await Promise.all([
        this.invalidateProducts(),
        CacheService.delPattern('products:count:*'),
        CacheService.delPattern('products:stats:*'),
      ])

      if (companyId) {
        await this.invalidateOnCompanyMutation(companyId)
      }

    } catch (error) {
      console.error('Smart invalidation failed for products:', error)
    }
  }

  /**
   * Invalidate all vendors-related caches
   */
  static async invalidateVendors(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('vendors:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate vendors caches:', error)
      return 0
    }
  }

  /**
   * Smart invalidation for vendor mutations
   */
  static async invalidateOnVendorMutation(vendorId?: string | number, companyId?: string | number): Promise<void> {
    try {
      
      await Promise.all([
        this.invalidateVendors(),
        CacheService.delPattern('vendors:count:*'),
        CacheService.delPattern('vendors:stats:*'),
      ])

      if (companyId) {
        await this.invalidateOnCompanyMutation(companyId)
      }

    } catch (error) {
      console.error('Smart invalidation failed for vendors:', error)
    }
  }

  /**
   * Invalidate all clients-related caches
   */
  static async invalidateClients(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('clients:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate clients caches:', error)
      return 0
    }
  }

  /**
   * Smart invalidation for client mutations
   */
  static async invalidateOnClientMutation(clientId?: string | number, companyId?: string | number): Promise<void> {
    try {
      
      await Promise.all([
        this.invalidateClients(),
        CacheService.delPattern('clients:count:*'),
        CacheService.delPattern('clients:stats:*'),
        // Clients affect invoices too
        this.invalidateInvoices(),
      ])

      if (companyId) {
        await this.invalidateOnCompanyMutation(companyId)
      }

    } catch (error) {
      console.error('Smart invalidation failed for clients:', error)
    }
  }

  /**
   * Invalidate all invoices-related caches
   */
  static async invalidateInvoices(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('invoices:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate invoices caches:', error)
      return 0
    }
  }

  /**
   * Smart invalidation for invoice mutations
   */
  static async invalidateOnInvoiceMutation(invoiceId?: string | number, companyId?: string | number, clientId?: string | number): Promise<void> {
    try {
      
      await Promise.all([
        this.invalidateInvoices(),
        CacheService.delPattern('invoices:count:*'),
        CacheService.delPattern('invoices:stats:*'),
        // Invoices affect client stats
        this.invalidateClients(),
      ])

      if (companyId) {
        await this.invalidateOnCompanyMutation(companyId)
      }

    } catch (error) {
      console.error('Smart invalidation failed for invoices:', error)
    }
  }

  /**
   * Invalidate all bank accounts-related caches
   */
  static async invalidateBankAccounts(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('bankAccounts:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate bank accounts caches:', error)
      return 0
    }
  }

  /**
   * Smart invalidation for bank account mutations
   */
  static async invalidateOnBankAccountMutation(bankAccountId?: string | number, companyId?: string | number): Promise<void> {
    try {
      
      await Promise.all([
        this.invalidateBankAccounts(),
        CacheService.delPattern('bankAccounts:count:*'),
        CacheService.delPattern('bankAccounts:stats:*'),
      ])

      if (companyId) {
        await this.invalidateOnCompanyMutation(companyId)
      }

    } catch (error) {
      console.error('Smart invalidation failed for bank accounts:', error)
    }
  }

  /**
   * Invalidate all digital wallets-related caches
   */
  static async invalidateDigitalWallets(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('digitalWallets:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate digital wallets caches:', error)
      return 0
    }
  }

  /**
   * Smart invalidation for digital wallet mutations
   */
  static async invalidateOnDigitalWalletMutation(walletId?: string | number, companyId?: string | number): Promise<void> {
    try {
      
      await Promise.all([
        this.invalidateDigitalWallets(),
        CacheService.delPattern('digitalWallets:count:*'),
        CacheService.delPattern('digitalWallets:stats:*'),
      ])

      if (companyId) {
        await this.invalidateOnCompanyMutation(companyId)
      }

    } catch (error) {
      console.error('Smart invalidation failed for digital wallets:', error)
    }
  }

  /**
   * Invalidate chart of accounts-related caches
   */
  static async invalidateChartOfAccounts(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('chart-of-accounts:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate chart of accounts caches:', error)
      return 0
    }
  }

  /**
   * Invalidate all cashflow-related caches
   */
  static async invalidateCashflow(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('cashflow:*')
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate cashflow caches:', error)
      return 0
    }
  }

  /**
   * Invalidate cashflow caches for a specific company
   */
  static async invalidateCashflowCache(companyId: number): Promise<void> {
    try {
      await Promise.all([
        this.invalidateCashflow(),
        CacheService.delPattern(`cashflow:*${companyId}*`),
      ])
    } catch (error) {
      console.error(`Failed to invalidate cashflow cache for company ${companyId}:`, error)
    }
  }

  /**
   * Smart invalidation for chart of accounts mutations
   */
  static async invalidateOnChartOfAccountsMutation(accountId?: string | number, companyId?: string | number): Promise<void> {
    try {
      
      await Promise.all([
        this.invalidateChartOfAccounts(),
        CacheService.delPattern('chart-of-accounts:count:*'),
        CacheService.delPattern('chart-of-accounts:stats:*'),
      ])

      if (companyId) {
        await this.invalidateOnCompanyMutation(companyId)
      }

    } catch (error) {
      console.error('Smart invalidation failed for chart of accounts:', error)
    }
  }

  /**
   * Invalidate caches by pattern (generic method)
   */
  static async invalidatePattern(pattern: string): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern(`${pattern}:*`)
      return deletedCount
    } catch (error) {
      console.error(`Failed to invalidate pattern ${pattern}:`, error)
      return 0
    }
  }

  /**
   * Emergency cache clear - removes all cached data
   */
  static async clearAll(): Promise<number> {
    try {
      const deletedCount = await CacheService.delPattern('*')
      return deletedCount
    } catch (error) {
      console.error('Emergency cache clear failed:', error)
      return 0
    }
  }

  /**
   * Warm up critical caches with fresh data
   */
  static async warmUpCaches(): Promise<void> {
    try {
      
      // This would trigger fresh data loading for commonly accessed endpoints
      // Implementation would depend on your most critical endpoints
      
    } catch (error) {
      console.error('Cache warm-up failed:', error)
    }
  }
}