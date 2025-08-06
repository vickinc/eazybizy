import { CurrencyRate } from '@/types/currency.types'
import { CurrencyRatesBusinessService, CurrencyRatesData } from '@/services/business/currencyRatesBusinessService'
import { CurrencyRatesDatabaseService } from '@/services/api/currencyRatesDatabaseService'

/**
 * Direct database service for Currency Rates SSR
 * Loads currency rates data from the database for server-side rendering
 */
export class CurrencyRatesSSRService {
  /**
   * Get currency rates for server-side rendering
   * Loads data from the database or falls back to defaults
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
      console.log('🚀 SSR: Loading currency rates from database...');
      
      // Load rates from database
      const dbRates = await CurrencyRatesDatabaseService.findAll();
      console.log(`✅ SSR: Loaded ${dbRates.length} rates from database`);
      
      if (dbRates.length > 0) {
        // Convert database rates to application format
        const rates = CurrencyRatesDatabaseService.toCurrencyRates(dbRates);
        
        // Get the latest update timestamp
        const latestUpdate = dbRates.reduce((latest, rate) => {
          return rate.lastUpdated > latest ? rate.lastUpdated : latest;
        }, new Date(0));
        
        return {
          rates,
          baseCurrency: 'USD',
          lastSaved: latestUpdate.toISOString(),
          version: 2, // Updated version for database storage
          cached: false,
          userId,
          companyId,
        };
      } else {
        console.log('⚠️ SSR: No rates in database, using defaults');
        // Database is empty, return defaults
        const defaultFiatRates = CurrencyRatesBusinessService.getDefaultFiatCurrencies();
        const defaultCryptoRates = CurrencyRatesBusinessService.getDefaultCryptoCurrencies();
        const defaultRates = [...defaultFiatRates, ...defaultCryptoRates];
        
        return {
          rates: defaultRates,
          baseCurrency: 'USD',
          lastSaved: new Date().toISOString(),
          version: 2,
          cached: false,
          userId,
          companyId,
        };
      }
    } catch (error) {
      console.error('❌ SSR: CurrencyRatesSSRService error:', error);
      // Return minimal default data on error
      const fallbackFiatRates = CurrencyRatesBusinessService.getDefaultFiatCurrencies();
      const fallbackCryptoRates = CurrencyRatesBusinessService.getDefaultCryptoCurrencies();
      return {
        rates: [...fallbackFiatRates, ...fallbackCryptoRates],
        baseCurrency: 'USD',
        lastSaved: new Date().toISOString(),
        version: 2,
        cached: false,
        userId,
        companyId,
      };
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
   * Save currency rates to database
   * Used for server-side operations that need to persist rates
   */
  static async saveCurrencyRates(
    rates: CurrencyRate[],
    userId: string,
    companyId?: string
  ): Promise<boolean> {
    try {
      console.log(`💾 SSR: Saving ${rates.length} currency rates to database...`);
      
      const createInputs = rates.map(rate => ({
        code: rate.code,
        name: rate.name,
        rate: rate.rate,
        type: rate.type,
        source: 'ssr'
      }));
      
      await CurrencyRatesDatabaseService.bulkUpsert(createInputs);
      console.log(`✅ SSR: Successfully saved ${rates.length} currency rates`);
      
      return true;
    } catch (error) {
      console.error('❌ SSR: Error saving currency rates:', error);
      return false;
    }
  }
}