import { CurrencyRate } from '@/types';

// Free Currency API response interfaces
export interface FreeCurrencyAPILatestResponse {
  meta?: {
    last_updated_at?: string;
  };
  data: Record<string, number>;
}

export interface FreeCurrencyAPIHistoricalResponse {
  meta?: {
    last_updated_at?: string;
  };
  data: Record<string, Record<string, number>>;
}

export interface FreeCurrencyAPICurrenciesResponse {
  data: Record<string, {
    symbol: string;
    name: string;
    symbol_native: string;
    decimal_digits: number;
    rounding: number;
    code: string;
    name_plural: string;
    type: string;
  }>;
}

export interface CurrencyRatesFetchResult {
  success: boolean;
  data?: CurrencyRate[];
  error?: string;
  rateLimit?: {
    limitMonth: number;
    remainingMonth: number;
  };
}

export interface HistoricalRatesFetchResult {
  success: boolean;
  data?: { date: string; rates: CurrencyRate[] }[];
  error?: string;
  rateLimit?: {
    limitMonth: number;
    remainingMonth: number;
  };
}

/**
 * Service for integrating with Free Currency API (freecurrencyapi.com)
 * Provides current and historical exchange rates
 */
export class CurrencyAPIService {
  private static readonly BASE_URL = 'https://api.freecurrencyapi.com/v1';
  private static readonly API_KEY = process.env.FREE_CURRENCY_API_KEY;

  /**
   * Check if API key is configured
   */
  static isConfigured(): boolean {
    return !!this.API_KEY;
  }

  /**
   * Get API status (doesn't count against quota)
   */
  static async getStatus(): Promise<{ success: boolean; status?: any; error?: string }> {
    try {
      if (!this.API_KEY) {
        return { success: false, error: 'API key not configured' };
      }

      const response = await fetch(`${this.BASE_URL}/status`, {
        headers: {
          'apikey': this.API_KEY
        }
      });

      if (!response.ok) {
        return { success: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      return { success: true, status: data };
    } catch (error) {
      console.error('CurrencyAPIService.getStatus error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get list of supported currencies
   */
  static async getCurrencies(): Promise<{ success: boolean; currencies?: any; error?: string }> {
    try {
      if (!this.API_KEY) {
        return { success: false, error: 'API key not configured' };
      }

      const response = await fetch(`${this.BASE_URL}/currencies`, {
        headers: {
          'apikey': this.API_KEY
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          return { success: false, error: 'Rate limit exceeded' };
        }
        return { success: false, error: `API error: ${response.status}` };
      }

      const data: FreeCurrencyAPICurrenciesResponse = await response.json();
      return { success: true, currencies: data.data };
    } catch (error) {
      console.error('CurrencyAPIService.getCurrencies error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Fetch latest currency rates
   * @param baseCurrency Base currency (default: USD)
   * @param currencies Specific currencies to fetch (optional)
   */
  static async getLatestRates(
    baseCurrency: string = 'USD',
    currencies?: string[]
  ): Promise<CurrencyRatesFetchResult> {
    try {
      if (!this.API_KEY) {
        return { success: false, error: 'API key not configured' };
      }

      // Build query parameters
      const params = new URLSearchParams({
        base_currency: baseCurrency
      });

      if (currencies && currencies.length > 0) {
        params.append('currencies', currencies.join(','));
      }

      const response = await fetch(`${this.BASE_URL}/latest?${params.toString()}`, {
        headers: {
          'apikey': this.API_KEY
        }
      });

      // Extract rate limit info from headers
      const rateLimit = {
        limitMonth: parseInt(response.headers.get('X-RateLimit-Limit-Quota-Month') || '0'),
        remainingMonth: parseInt(response.headers.get('X-RateLimit-Remaining-Quota-Month') || '0')
      };

      if (!response.ok) {
        if (response.status === 429) {
          return { success: false, error: 'Rate limit exceeded', rateLimit };
        }
        return { success: false, error: `API error: ${response.status}`, rateLimit };
      }

      const data: FreeCurrencyAPILatestResponse = await response.json();
      
      // Convert API response to our CurrencyRate format
      const currentTime = new Date().toISOString();
      const currencyRates: CurrencyRate[] = Object.entries(data.data).map(([code, rate]) => ({
        code,
        name: this.getCurrencyName(code),
        rate: typeof rate === 'number' ? rate : parseFloat(String(rate)) || 0,
        type: this.getCurrencyType(code),
        lastUpdated: data.meta?.last_updated_at || currentTime
      }));

      return {
        success: true,
        data: currencyRates,
        rateLimit
      };
    } catch (error) {
      console.error('CurrencyAPIService.getLatestRates error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Fetch historical currency rates for a specific date
   * @param date Date in YYYY-MM-DD format
   * @param baseCurrency Base currency (default: USD)
   * @param currencies Specific currencies to fetch (optional)
   */
  static async getHistoricalRates(
    date: string,
    baseCurrency: string = 'USD',
    currencies?: string[]
  ): Promise<CurrencyRatesFetchResult> {
    try {
      if (!this.API_KEY) {
        return { success: false, error: 'API key not configured' };
      }

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { success: false, error: 'Invalid date format. Use YYYY-MM-DD' };
      }

      // Build query parameters
      const params = new URLSearchParams({
        date,
        base_currency: baseCurrency
      });

      if (currencies && currencies.length > 0) {
        params.append('currencies', currencies.join(','));
      }

      const response = await fetch(`${this.BASE_URL}/historical?${params.toString()}`, {
        headers: {
          'apikey': this.API_KEY
        }
      });

      // Extract rate limit info from headers
      const rateLimit = {
        limitMonth: parseInt(response.headers.get('X-RateLimit-Limit-Quota-Month') || '0'),
        remainingMonth: parseInt(response.headers.get('X-RateLimit-Remaining-Quota-Month') || '0')
      };

      if (!response.ok) {
        if (response.status === 429) {
          return { success: false, error: 'Rate limit exceeded', rateLimit };
        }
        return { success: false, error: `API error: ${response.status}`, rateLimit };
      }

      const data: FreeCurrencyAPIHistoricalResponse = await response.json();
      
      // Convert API response to our CurrencyRate format
      const dateData = data.data[date];
      if (!dateData) {
        return { success: false, error: `No data available for date: ${date}` };
      }

      const currentTime = new Date().toISOString();
      const currencyRates: CurrencyRate[] = Object.entries(dateData).map(([code, rate]) => ({
        code,
        name: this.getCurrencyName(code),
        rate: typeof rate === 'number' ? rate : parseFloat(String(rate)) || 0,
        type: this.getCurrencyType(code),
        lastUpdated: data.meta?.last_updated_at || currentTime
      }));

      return {
        success: true,
        data: currencyRates,
        rateLimit
      };
    } catch (error) {
      console.error('CurrencyAPIService.getHistoricalRates error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Fetch historical rates for multiple dates
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format  
   * @param baseCurrency Base currency (default: USD)
   * @param currencies Specific currencies to fetch (optional)
   */
  static async getHistoricalRatesRange(
    startDate: string,
    endDate: string,
    baseCurrency: string = 'USD',
    currencies?: string[]
  ): Promise<HistoricalRatesFetchResult> {
    try {
      if (!this.API_KEY) {
        return { success: false, error: 'API key not configured' };
      }

      // Generate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates: string[] = [];
      
      const current = new Date(start);
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }

      // Fetch data for each date (be careful with rate limits)
      const results = [];
      let rateLimit;

      for (const date of dates) {
        const result = await this.getHistoricalRates(date, baseCurrency, currencies);
        
        if (result.success && result.data) {
          results.push({
            date,
            rates: result.data
          });
        }

        rateLimit = result.rateLimit;

        // If we hit rate limit, break
        if (!result.success && result.error === 'Rate limit exceeded') {
          return { success: false, error: 'Rate limit exceeded during bulk fetch', rateLimit };
        }

        // Small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        success: true,
        data: results,
        rateLimit
      };
    } catch (error) {
      console.error('CurrencyAPIService.getHistoricalRatesRange error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get currency name from code (fallback to code if not found)
   */
  private static getCurrencyName(code: string): string {
    const currencyNames: Record<string, string> = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'JPY': 'Japanese Yen',
      'AUD': 'Australian Dollar',
      'CAD': 'Canadian Dollar',
      'CHF': 'Swiss Franc',
      'CNY': 'Chinese Yuan',
      'SEK': 'Swedish Krona',
      'NZD': 'New Zealand Dollar',
      'MXN': 'Mexican Peso',
      'SGD': 'Singapore Dollar',
      'HKD': 'Hong Kong Dollar',
      'NOK': 'Norwegian Krone',
      'DKK': 'Danish Krone',
      'PLN': 'Polish Zloty',
      'CZK': 'Czech Koruna',
      'HUF': 'Hungarian Forint',
      'ILS': 'Israeli Shekel',
      'CLP': 'Chilean Peso',
      'PHP': 'Philippine Peso',
      'AED': 'UAE Dirham',
      'COP': 'Colombian Peso',
      'SAR': 'Saudi Riyal',
      'MYR': 'Malaysian Ringgit',
      'RON': 'Romanian Leu',
      'THB': 'Thai Baht',
      'TRY': 'Turkish Lira',
      'BRL': 'Brazilian Real',
      'TWD': 'Taiwan Dollar',
      'ZAR': 'South African Rand',
      'KRW': 'South Korean Won',
      'INR': 'Indian Rupee',
      'RUB': 'Russian Ruble'
    };

    return currencyNames[code] || code;
  }

  /**
   * Determine currency type (all fiat for now since crypto rates aren't provided by this API)
   */
  private static getCurrencyType(code: string): 'fiat' | 'crypto' {
    // Free Currency API only provides fiat currencies
    return 'fiat';
  }
}