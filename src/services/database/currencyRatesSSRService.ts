import { CurrencyRate } from '@/types/currency.types'
import { CurrencyRatesBusinessService, CurrencyRatesData } from '@/services/business/currencyRatesBusinessService'

/**
 * Direct database service for Currency Rates SSR
 * Since currency rates are currently stored in localStorage,
 * this service provides a server-side interface to the business logic
 * 
 * Future enhancement: When currency rates are moved to database,
 * this service will query the database directly instead of using defaults
 */
export class CurrencyRatesSSRService {
  /**
   * Get currency rates for server-side rendering
   * Currently returns default rates as there's no database persistence
   * 
   * @param userId - User ID (for future multi-user support)
   * @param companyId - Company ID (for future company-specific rates)
   * @returns Currency rates data with metadata
   */
  static async getCurrencyRatesForSSR(
    userId?: string,
    companyId?: string
  ): Promise<CurrencyRatesData> {
    try {
      // For now, return default rates since there's no database persistence
      // In the future, this will query the database
      const defaultFiatRates = CurrencyRatesBusinessService.getDefaultFiatCurrencies()
      const defaultCryptoRates = CurrencyRatesBusinessService.getDefaultCryptoCurrencies()
      const defaultRates = [...defaultFiatRates, ...defaultCryptoRates]
      
      return {
        rates: defaultRates,
        baseCurrency: 'USD',
        lastSaved: new Date().toISOString(),
        version: 1,
        // Additional metadata for SSR
        cached: false,
        userId,
        companyId,
      }
    } catch (error) {
      console.error('CurrencyRatesSSRService error:', error)
      // Return minimal default data on error
      const fallbackFiatRates = CurrencyRatesBusinessService.getDefaultFiatCurrencies()
      const fallbackCryptoRates = CurrencyRatesBusinessService.getDefaultCryptoCurrencies()
      return {
        rates: [...fallbackFiatRates, ...fallbackCryptoRates],
        baseCurrency: 'USD',
        lastSaved: new Date().toISOString(),
        version: 1,
        cached: false,
        userId,
        companyId,
      }
    }
  }

  /**
   * Get enhanced currency rates with UI metadata
   * Used for initial hydration of the client component
   */
  static async getEnhancedRatesForSSR(
    userId?: string,
    companyId?: string
  ) {
    const data = await this.getCurrencyRatesForSSR(userId, companyId)
    
    // Separate fiat and crypto rates
    const fiatRates = data.rates.filter(rate => rate.type === 'fiat')
    const cryptoRates = data.rates.filter(rate => rate.type === 'crypto')
    
    // Use the business service to create enhanced rates
    const processedData = CurrencyRatesBusinessService.processRatesData(
      fiatRates,
      cryptoRates
    )
    
    return {
      fiatRates: processedData.enhancedFiatRates,
      cryptoRates: processedData.enhancedCryptoRates,
      baseCurrency: data.baseCurrency,
      lastSaved: data.lastSaved,
      metadata: {
        userId: data.userId,
        companyId: data.companyId,
        cached: data.cached,
      }
    }
  }

  /**
   * Validate user access to currency rates
   * For future implementation when rates are company-specific
   */
  static async validateUserAccess(
    userId: string,
    companyId?: string
  ): Promise<boolean> {
    // For now, all authenticated users have access
    // Future: Check user permissions for company-specific rates
    return true
  }

  /**
   * Get currency rate summary statistics
   * Useful for dashboards and reports
   */
  static async getCurrencyRateSummary(
    userId?: string,
    companyId?: string
  ) {
    const data = await this.getCurrencyRatesForSSR(userId, companyId)
    const fiatRates = data.rates.filter(rate => rate.type === 'FIAT')
    const cryptoRates = data.rates.filter(rate => rate.type === 'CRYPTO')
    
    return {
      totalCurrencies: data.rates.length,
      fiatCurrencies: fiatRates.length,
      cryptoCurrencies: cryptoRates.length,
      baseCurrency: data.baseCurrency,
      lastUpdated: data.lastSaved,
      // Calculate some basic statistics
      stats: {
        averageFiatRate: fiatRates.reduce((sum, rate) => sum + rate.rate, 0) / fiatRates.length,
        highestRate: Math.max(...data.rates.map(r => r.rate)),
        lowestRate: Math.min(...data.rates.filter(r => r.rate > 0).map(r => r.rate)),
      }
    }
  }

  /**
   * Future method: Save currency rates to database
   * Currently not implemented as rates are stored in localStorage
   */
  static async saveCurrencyRates(
    rates: CurrencyRate[],
    userId: string,
    companyId?: string
  ): Promise<boolean> {
    // TODO: Implement when database schema is added
    console.warn('CurrencyRatesSSRService.saveCurrencyRates not implemented - rates are currently stored in localStorage')
    return false
  }
}