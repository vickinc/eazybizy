import { CurrencyRate } from '@/types';
import { CurrencyRatesApiService } from '@/services/api/currencyRatesApiService';

// Dynamic import to avoid loading Prisma in browser
let CurrencyRatesDatabaseService: any = null;
if (typeof window === 'undefined') {
  // Only import on server-side
  CurrencyRatesDatabaseService = require('@/services/api/currencyRatesDatabaseService').CurrencyRatesDatabaseService;
}

/**
 * Service to integrate currency rates across the application
 * Works in both server-side and client-side environments
 */
export class CurrencyRatesIntegrationService {
  private static ratesCache: { [key: string]: number } | null = null;
  private static cacheTimestamp: number | null = null;
  private static readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

  /**
   * Get exchange rates as a simple object for currency conversions
   * Works in both SSR and client environments
   */
  static async getExchangeRatesForConversion(): Promise<{ [key: string]: number }> {
    // Check cache first
    const now = Date.now();
    if (this.ratesCache && this.cacheTimestamp && (now - this.cacheTimestamp < this.CACHE_DURATION)) {
      return this.ratesCache;
    }

    try {
      let rates: CurrencyRate[] = [];

      // Determine environment and use appropriate service
      if (typeof window === 'undefined' && CurrencyRatesDatabaseService) {
        // Server-side: use database service directly
        console.log('🔄 Loading exchange rates from database (SSR)...');
        const dbRates = await CurrencyRatesDatabaseService.findAll();
        rates = CurrencyRatesDatabaseService.toCurrencyRates(dbRates);
        console.log(`✅ Loaded ${rates.length} rates from database (SSR)`);
      } else {
        // Client-side: use API service
        console.log('🔄 Loading exchange rates from API (client)...');
        rates = await CurrencyRatesApiService.findAll();
        console.log(`✅ Loaded ${rates.length} rates from API (client)`);
      }

      // Convert to simple object format
      const exchangeRates: { [key: string]: number } = { 'USD': 1 };
      
      rates.forEach(rate => {
        if (rate && rate.code && typeof rate.rate === 'number') {
          exchangeRates[rate.code] = rate.rate;
        }
      });

      // Cache the results
      this.ratesCache = exchangeRates;
      this.cacheTimestamp = now;

      console.log(`💰 Exchange rates loaded: ${Object.keys(exchangeRates).length} currencies`);
      return exchangeRates;

    } catch (error) {
      console.error('❌ Error loading exchange rates:', error);
      
      // Fallback to USD only if everything fails
      const fallbackRates = { 'USD': 1 };
      this.ratesCache = fallbackRates;
      this.cacheTimestamp = now;
      
      return fallbackRates;
    }
  }

  /**
   * Convert amount from one currency to USD using database rates
   */
  static async convertToUSD(amount: number, fromCurrency: string): Promise<number> {
    if (fromCurrency === 'USD') {
      return amount;
    }

    const exchangeRates = await this.getExchangeRatesForConversion();
    const rate = exchangeRates[fromCurrency.toUpperCase()];
    
    if (typeof rate === 'number' && rate > 0) {
      const converted = amount * rate;
      
      // Only log significant conversions in development to reduce console spam
      if (process.env.NODE_ENV === 'development' && amount > 0.01 && ['ETH', 'BTC', 'TRX'].includes(fromCurrency.toUpperCase())) {
        console.log(`💱 Converted ${amount} ${fromCurrency} to ${converted} USD (rate: ${rate})`);
      }
      
      return converted;
    }

    console.warn(`⚠️ No exchange rate found for ${fromCurrency}, returning original amount`);
    return amount;
  }

  /**
   * Convert amount between any two currencies using database rates
   */
  static async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Convert through USD as the base currency
    const usdAmount = await this.convertToUSD(amount, fromCurrency);
    
    if (toCurrency === 'USD') {
      return usdAmount;
    }

    const exchangeRates = await this.getExchangeRatesForConversion();
    const toRate = exchangeRates[toCurrency.toUpperCase()];
    
    if (typeof toRate === 'number' && toRate > 0) {
      const converted = usdAmount / toRate;
      console.log(`💱 Converted ${amount} ${fromCurrency} to ${converted} ${toCurrency} via USD`);
      return converted;
    }

    console.warn(`⚠️ No exchange rate found for ${toCurrency}, returning USD amount`);
    return usdAmount;
  }

  /**
   * Clear the rates cache (useful when rates are updated)
   */
  static clearCache(): void {
    this.ratesCache = null;
    this.cacheTimestamp = null;
    console.log('🗑️ Exchange rates cache cleared');
  }

  /**
   * Get cache info for debugging
   */
  static getCacheInfo(): { cached: boolean; age: number; ratesCount: number } {
    const now = Date.now();
    return {
      cached: !!this.ratesCache,
      age: this.cacheTimestamp ? now - this.cacheTimestamp : 0,
      ratesCount: this.ratesCache ? Object.keys(this.ratesCache).length : 0
    };
  }
}