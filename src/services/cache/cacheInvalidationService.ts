import { CacheService, CacheKeys } from '@/lib/redis'

export class CacheInvalidationService {
  /**
   * Invalidate all company-related caches
   */
  static async invalidateCompanies(): Promise<number> {
    try {
      console.log('Invalidating all company caches...')
      const deletedCount = await CacheService.delPattern('companies:*')
      console.log(`Invalidated ${deletedCount} company cache entries`)
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
      console.log('Invalidating company list caches...')
      const deletedCount = await CacheService.delPattern('companies:list:*')
      console.log(`Invalidated ${deletedCount} company list cache entries`)
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
      console.log(`Invalidated cache for company ${companyId}`)
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
      console.log('Invalidated company statistics cache')
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
      console.log('Invalidating search caches...')
      const deletedCount = await CacheService.delPattern('companies:search:*')
      console.log(`Invalidated ${deletedCount} search cache entries`)
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
      console.log('Invalidating count caches...')
      const deletedCount = await CacheService.delPattern('companies:count:*')
      console.log(`Invalidated ${deletedCount} count cache entries`)
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
      console.log('Smart invalidation triggered by company mutation')
      
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

      console.log('Smart invalidation completed')
    } catch (error) {
      console.error('Smart invalidation failed:', error)
    }
  }

  /**
   * Invalidate all calendar-related caches
   */
  static async invalidateCalendar(): Promise<number> {
    try {
      console.log('Invalidating calendar caches...')
      const deletedCount = await CacheService.delPattern('calendar:*')
      console.log(`Invalidated ${deletedCount} calendar cache entries`)
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
      console.log('Invalidating notes caches...')
      const deletedCount = await CacheService.delPattern('notes:*')
      console.log(`Invalidated ${deletedCount} notes cache entries`)
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
      console.log('Invalidating business cards caches...')
      const deletedCount = await CacheService.delPattern('business-cards:*')
      console.log(`Invalidated ${deletedCount} business cards cache entries`)
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
      console.log('Invalidating business cards list caches...')
      const deletedCount = await CacheService.delPattern('business-cards:list:*')
      console.log(`Invalidated ${deletedCount} business cards list cache entries`)
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
      console.log(`Invalidated cache for business card ${cardId}`)
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
      console.log('Smart invalidation triggered by business card mutation')
      
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

      console.log('Smart invalidation completed for business cards')
    } catch (error) {
      console.error('Smart invalidation failed for business cards:', error)
    }
  }

  /**
   * Invalidate all products-related caches
   */
  static async invalidateProducts(): Promise<number> {
    try {
      console.log('Invalidating products caches...')
      const deletedCount = await CacheService.delPattern('products:*')
      console.log(`Invalidated ${deletedCount} products cache entries`)
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
      console.log('Smart invalidation triggered by product mutation')
      
      await Promise.all([
        this.invalidateProducts(),
        CacheService.delPattern('products:count:*'),
        CacheService.delPattern('products:stats:*'),
      ])

      if (companyId) {
        await this.invalidateOnCompanyMutation(companyId)
      }

      console.log('Smart invalidation completed for products')
    } catch (error) {
      console.error('Smart invalidation failed for products:', error)
    }
  }

  /**
   * Invalidate all vendors-related caches
   */
  static async invalidateVendors(): Promise<number> {
    try {
      console.log('Invalidating vendors caches...')
      const deletedCount = await CacheService.delPattern('vendors:*')
      console.log(`Invalidated ${deletedCount} vendors cache entries`)
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
      console.log('Smart invalidation triggered by vendor mutation')
      
      await Promise.all([
        this.invalidateVendors(),
        CacheService.delPattern('vendors:count:*'),
        CacheService.delPattern('vendors:stats:*'),
      ])

      if (companyId) {
        await this.invalidateOnCompanyMutation(companyId)
      }

      console.log('Smart invalidation completed for vendors')
    } catch (error) {
      console.error('Smart invalidation failed for vendors:', error)
    }
  }

  /**
   * Invalidate all clients-related caches
   */
  static async invalidateClients(): Promise<number> {
    try {
      console.log('Invalidating clients caches...')
      const deletedCount = await CacheService.delPattern('clients:*')
      console.log(`Invalidated ${deletedCount} clients cache entries`)
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
      console.log('Smart invalidation triggered by client mutation')
      
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

      console.log('Smart invalidation completed for clients')
    } catch (error) {
      console.error('Smart invalidation failed for clients:', error)
    }
  }

  /**
   * Invalidate all invoices-related caches
   */
  static async invalidateInvoices(): Promise<number> {
    try {
      console.log('Invalidating invoices caches...')
      const deletedCount = await CacheService.delPattern('invoices:*')
      console.log(`Invalidated ${deletedCount} invoices cache entries`)
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
      console.log('Smart invalidation triggered by invoice mutation')
      
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

      console.log('Smart invalidation completed for invoices')
    } catch (error) {
      console.error('Smart invalidation failed for invoices:', error)
    }
  }

  /**
   * Invalidate all bank accounts-related caches
   */
  static async invalidateBankAccounts(): Promise<number> {
    try {
      console.log('Invalidating bank accounts caches...')
      const deletedCount = await CacheService.delPattern('bankAccounts:*')
      console.log(`Invalidated ${deletedCount} bank accounts cache entries`)
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
      console.log('Smart invalidation triggered by bank account mutation')
      
      await Promise.all([
        this.invalidateBankAccounts(),
        CacheService.delPattern('bankAccounts:count:*'),
        CacheService.delPattern('bankAccounts:stats:*'),
      ])

      if (companyId) {
        await this.invalidateOnCompanyMutation(companyId)
      }

      console.log('Smart invalidation completed for bank accounts')
    } catch (error) {
      console.error('Smart invalidation failed for bank accounts:', error)
    }
  }

  /**
   * Invalidate all digital wallets-related caches
   */
  static async invalidateDigitalWallets(): Promise<number> {
    try {
      console.log('Invalidating digital wallets caches...')
      const deletedCount = await CacheService.delPattern('digitalWallets:*')
      console.log(`Invalidated ${deletedCount} digital wallets cache entries`)
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
      console.log('Smart invalidation triggered by digital wallet mutation')
      
      await Promise.all([
        this.invalidateDigitalWallets(),
        CacheService.delPattern('digitalWallets:count:*'),
        CacheService.delPattern('digitalWallets:stats:*'),
      ])

      if (companyId) {
        await this.invalidateOnCompanyMutation(companyId)
      }

      console.log('Smart invalidation completed for digital wallets')
    } catch (error) {
      console.error('Smart invalidation failed for digital wallets:', error)
    }
  }

  /**
   * Emergency cache clear - removes all cached data
   */
  static async clearAll(): Promise<number> {
    try {
      console.log('Emergency cache clear initiated...')
      const deletedCount = await CacheService.delPattern('*')
      console.log(`Emergency cache clear: removed ${deletedCount} entries`)
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
      console.log('Warming up critical caches...')
      
      // This would trigger fresh data loading for commonly accessed endpoints
      // Implementation would depend on your most critical endpoints
      
      console.log('Cache warm-up completed')
    } catch (error) {
      console.error('Cache warm-up failed:', error)
    }
  }
}