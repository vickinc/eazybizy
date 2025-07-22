import { CurrencyRate } from '@/types';

// API Ninjas response interfaces (for crypto)
export interface CryptoPriceResponse {
  symbol: string;
  price: number;
  timestamp: number;
}

// Free Currency API response interfaces (for FIAT)
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

export interface CurrencyRatesFetchResult {
  success: boolean;
  data?: CurrencyRate[];
  error?: string;
  rateLimit?: {
    limitMonth: number;
    remainingMonth: number;
  };
}

/**
 * Hybrid Currency Service
 * Uses API Ninjas for cryptocurrency prices and Free Currency API for FIAT exchange rates
 */
export class CurrencyAPIService {
  // API Ninjas configuration (for crypto)
  private static readonly API_NINJAS_BASE_URL = 'https://api.api-ninjas.com/v1';
  private static readonly API_NINJAS_KEY = process.env.API_NINJAS_KEY;

  // Free Currency API configuration (for FIAT)
  private static readonly FREE_CURRENCY_BASE_URL = 'https://api.freecurrencyapi.com/v1';
  private static readonly FREE_CURRENCY_API_KEY = process.env.FREE_CURRENCY_API_KEY;

  /**
   * Check if both APIs are configured
   */
  static isConfigured(): boolean {
    return !!(this.API_NINJAS_KEY && this.FREE_CURRENCY_API_KEY);
  }

  /**
   * Check which APIs are configured
   */
  static getAPIStatus(): { crypto: boolean; fiat: boolean; both: boolean } {
    const crypto = !!this.API_NINJAS_KEY;
    const fiat = !!this.FREE_CURRENCY_API_KEY;
    return {
      crypto,
      fiat,
      both: crypto && fiat
    };
  }

  /**
   * Get headers for API Ninjas
   */
  private static getAPINinjasHeaders(): HeadersInit {
    return {
      'X-Api-Key': this.API_NINJAS_KEY || '',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get headers for Free Currency API
   */
  private static getFreeCurrencyHeaders(): HeadersInit {
    return {
      'apikey': this.FREE_CURRENCY_API_KEY || '',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get currency name from currency code
   */
  private static getCurrencyName(code: string): string {
    const currencyNames: Record<string, string> = {
      // Major FIAT currencies
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
      'RUB': 'Russian Ruble',
      'BGN': 'Bulgarian Lev',
      'HRK': 'Croatian Kuna',
      'IDR': 'Indonesian Rupiah',
      'ISK': 'Icelandic Krona',
      
      // Major cryptocurrencies
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'Binance Coin',
      'ADA': 'Cardano',
      'XRP': 'Ripple',
      'SOL': 'Solana',
      'DOT': 'Polkadot',
      'DOGE': 'Dogecoin',
      'MATIC': 'Polygon',
      'LTC': 'Litecoin',
      'BCH': 'Bitcoin Cash',
      'LINK': 'Chainlink',
      'XLM': 'Stellar',
      'VET': 'VeChain',
      'TRX': 'TRON',
      'USDT': 'Tether',
      'USDC': 'USD Coin',
      'BUSD': 'Binance USD'
    };

    return currencyNames[code] || code;
  }

  /**
   * Determine currency type based on code
   */
  private static getCurrencyType(code: string): 'fiat' | 'crypto' {
    const cryptoCurrencies = new Set([
      'BTC', 'ETH', 'BNB', 'ADA', 'XRP', 'SOL', 'DOT', 'DOGE', 'MATIC', 
      'LTC', 'BCH', 'LINK', 'XLM', 'VET', 'TRX', 'USDT', 'USDC', 'BUSD'
    ]);
    
    return cryptoCurrencies.has(code) ? 'crypto' : 'fiat';
  }

  /**
   * Get default currencies list
   */
  private static getDefaultCurrencies(): { fiat: string[]; crypto: string[] } {
    return {
      fiat: [
        'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD', 'MXN',
        'SGD', 'HKD', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'ILS', 'CLP', 'PHP',
        'AED', 'COP', 'SAR', 'MYR', 'RON', 'THB', 'TRY', 'BRL', 'TWD', 'ZAR',
        'KRW', 'INR', 'RUB', 'BGN', 'HRK', 'IDR', 'ISK'
      ],
      crypto: [
        'BTC', 'ETH', 'BNB', 'ADA', 'XRP', 'SOL', 'DOT', 'DOGE', 'MATIC',
        'LTC', 'BCH', 'LINK', 'XLM', 'VET', 'TRX', 'USDT', 'USDC', 'BUSD'
      ]
    };
  }

  /**
   * Fetch cryptocurrency price from API Ninjas
   */
  private static async fetchCryptoPrice(symbol: string): Promise<number> {
    const url = `${this.API_NINJAS_BASE_URL}/cryptoprice?symbol=${symbol}USDT`; // Most crypto pairs are against USDT
    
    console.log(`Fetching crypto price for ${symbol} from ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAPINinjasHeaders()
    });

    if (!response.ok) {
      // Try with USD pair if USDT fails
      const usdUrl = `${this.API_NINJAS_BASE_URL}/cryptoprice?symbol=${symbol}USD`;
      const usdResponse = await fetch(usdUrl, {
        method: 'GET',
        headers: this.getAPINinjasHeaders()
      });
      
      if (!usdResponse.ok) {
        throw new Error(`Crypto price API error: ${response.status} ${response.statusText}`);
      }
      
      const usdData: CryptoPriceResponse = await usdResponse.json();
      return usdData.price;
    }

    const data: CryptoPriceResponse = await response.json();
    return data.price;
  }

  /**
   * Fetch historical cryptocurrency price from API Ninjas
   * Note: Historical crypto data requires API Ninjas Premium subscription
   */
  private static async fetchHistoricalCryptoPrice(symbol: string, date: string): Promise<number> {
    // Convert date to Unix timestamp (API Ninjas expects timestamp)
    const targetDate = new Date(date);
    const endTimestamp = Math.floor(targetDate.getTime() / 1000);
    const startTimestamp = endTimestamp - (24 * 60 * 60); // 24 hours before
    
    const url = `${this.API_NINJAS_BASE_URL}/cryptopricehistorical?symbol=${symbol}USD&start=${startTimestamp}&end=${endTimestamp}&limit=1`;
    
    console.log(`Attempting to fetch historical crypto price for ${symbol} on ${date}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAPINinjasHeaders()
    });

    if (!response.ok) {
      if (response.status === 402 || response.status === 403) {
        // Premium feature not available
        console.warn(`Historical crypto data requires API Ninjas Premium subscription for ${symbol} on ${date}, using current price`);
        throw new Error(`Historical crypto data requires premium subscription`);
      }
      
      // Other error, fallback to current price
      console.warn(`Historical crypto price API error for ${symbol} on ${date}: ${response.status}`);
      throw new Error(`Historical crypto price API error: ${response.status}`);
    }

    const data = await response.json();
    // API returns OHLCV data, use closing price
    if (data && Array.isArray(data) && data.length > 0) {
      return data[0].close || data[0].price || 0;
    }
    
    throw new Error(`No historical data available for ${symbol} on ${date}`);
  }

  /**
   * Fetch FIAT exchange rates from Free Currency API
   */
  private static async fetchFiatRates(baseCurrency: string = 'USD', currencies?: string[]): Promise<CurrencyRate[]> {
    const url = `${this.FREE_CURRENCY_BASE_URL}/latest`;
    const params = new URLSearchParams({
      base_currency: baseCurrency
    });

    if (currencies && currencies.length > 0) {
      params.append('currencies', currencies.join(','));
    }

    const fullUrl = `${url}?${params.toString()}`;
    console.log(`Fetching FIAT rates from ${fullUrl}`);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: this.getFreeCurrencyHeaders()
    });

    if (!response.ok) {
      throw new Error(`FIAT rates API error: ${response.status} ${response.statusText}`);
    }

    const data: FreeCurrencyAPILatestResponse = await response.json();
    const currentTime = new Date().toISOString();
    
    // Convert API response to our CurrencyRate format
    const currencyRates: CurrencyRate[] = Object.entries(data.data).map(([code, rate]) => ({
      code,
      name: this.getCurrencyName(code),
      rate: typeof rate === 'number' ? rate : parseFloat(String(rate)) || 0,
      type: 'fiat',
      lastUpdated: data.meta?.last_updated_at || currentTime
    }));

    return currencyRates;
  }

  /**
   * Get latest currency rates for both FIAT and crypto
   */
  static async getLatestRates(
    baseCurrency: string = 'USD',
    currencies?: string[]
  ): Promise<CurrencyRatesFetchResult> {
    try {
      const apiStatus = this.getAPIStatus();
      if (!apiStatus.crypto && !apiStatus.fiat) {
        return { success: false, error: 'No API keys configured' };
      }

      const defaultCurrencies = this.getDefaultCurrencies();
      const fiatCurrencies = currencies?.filter(c => this.getCurrencyType(c) === 'fiat') || defaultCurrencies.fiat;
      const cryptoCurrencies = currencies?.filter(c => this.getCurrencyType(c) === 'crypto') || defaultCurrencies.crypto;

      console.log('Hybrid API Processing:', {
        fiatCount: fiatCurrencies.length,
        cryptoCount: cryptoCurrencies.length,
        apiStatus
      });

      const currencyRates: CurrencyRate[] = [];
      const currentTime = new Date().toISOString();
      let fiatSuccess = 0;
      let cryptoSuccess = 0;
      const errors: string[] = [];

      // Add base currency (USD) with rate 1
      currencyRates.push({
        code: baseCurrency,
        name: this.getCurrencyName(baseCurrency),
        rate: 1,
        type: 'fiat',
        lastUpdated: currentTime
      });

      // Fetch FIAT currency rates from Free Currency API
      if (apiStatus.fiat && fiatCurrencies.length > 0) {
        try {
          const fiatRates = await this.fetchFiatRates(baseCurrency, fiatCurrencies);
          currencyRates.push(...fiatRates);
          fiatSuccess = fiatRates.length;
          console.log(`✅ FIAT: Successfully fetched ${fiatSuccess} rates`);
        } catch (error) {
          console.error('FIAT rates fetch failed:', error);
          errors.push(`FIAT rates: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else if (!apiStatus.fiat) {
        errors.push('FIAT rates: FREE_CURRENCY_API_KEY not configured');
      }

      // Fetch cryptocurrency prices from API Ninjas
      if (apiStatus.crypto && cryptoCurrencies.length > 0) {
        for (const crypto of cryptoCurrencies) {
          try {
            const price = await this.fetchCryptoPrice(crypto);
            currencyRates.push({
              code: crypto,
              name: this.getCurrencyName(crypto),
              rate: typeof price === 'number' ? price : parseFloat(String(price)) || 0,
              type: 'crypto',
              lastUpdated: currentTime
            });
            cryptoSuccess++;
          } catch (error) {
            console.warn(`Failed to fetch price for ${crypto}:`, error);
          }
        }
        console.log(`✅ Crypto: Successfully fetched ${cryptoSuccess} prices`);
      } else if (!apiStatus.crypto) {
        errors.push('Crypto prices: API_NINJAS_KEY not configured');
      }

      const totalSuccess = fiatSuccess + cryptoSuccess;
      
      // Determine success status and message
      if (totalSuccess === 0) {
        return {
          success: false,
          error: `Failed to fetch any rates. Errors: ${errors.join('; ')}`
        };
      }

      const result = {
        success: true,
        data: currencyRates,
        rateLimit: {
          limitMonth: 15000, // Combined limits from both APIs
          remainingMonth: 14000 // Estimate
        }
      };

      // Add informative message if some APIs failed
      if (errors.length > 0) {
        return {
          ...result,
          error: `Partial success: ${totalSuccess} currencies updated (${fiatSuccess} FIAT, ${cryptoSuccess} crypto). Issues: ${errors.join('; ')}`
        };
      }

      return result;

    } catch (error) {
      console.error('CurrencyAPIService.getLatestRates error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get historical currency rates
   * FIAT: Uses Free Currency API historical endpoint
   * Crypto: Returns current prices with historical timestamp (API Ninjas limitation)
   */
  static async getHistoricalRates(
    date: string,
    baseCurrency: string = 'USD',
    currencies?: string[]
  ): Promise<CurrencyRatesFetchResult> {
    try {
      const apiStatus = this.getAPIStatus();
      if (!apiStatus.crypto && !apiStatus.fiat) {
        return { success: false, error: 'No API keys configured' };
      }

      const defaultCurrencies = this.getDefaultCurrencies();
      const fiatCurrencies = currencies?.filter(c => this.getCurrencyType(c) === 'fiat') || defaultCurrencies.fiat;
      const cryptoCurrencies = currencies?.filter(c => this.getCurrencyType(c) === 'crypto') || defaultCurrencies.crypto;

      const currencyRates: CurrencyRate[] = [];
      const historicalTime = `${date}T12:00:00.000Z`;
      let fiatSuccess = 0;
      let cryptoSuccess = 0;
      const errors: string[] = [];

      // Add base currency
      currencyRates.push({
        code: baseCurrency,
        name: this.getCurrencyName(baseCurrency),
        rate: 1,
        type: 'fiat',
        lastUpdated: historicalTime
      });

      // Fetch historical FIAT rates
      if (apiStatus.fiat && fiatCurrencies.length > 0) {
        try {
          const url = `${this.FREE_CURRENCY_BASE_URL}/historical`;
          const params = new URLSearchParams({
            date,
            base_currency: baseCurrency,
            currencies: fiatCurrencies.join(',')
          });

          const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            headers: this.getFreeCurrencyHeaders()
          });

          if (!response.ok) {
            throw new Error(`Historical FIAT API error: ${response.status}`);
          }

          const data: FreeCurrencyAPIHistoricalResponse = await response.json();
          const dateData = data.data[date];

          if (dateData) {
            const historicalRates = Object.entries(dateData).map(([code, rate]) => ({
              code,
              name: this.getCurrencyName(code),
              rate: typeof rate === 'number' ? rate : parseFloat(String(rate)) || 0,
              type: 'fiat' as const,
              lastUpdated: historicalTime
            }));
            currencyRates.push(...historicalRates);
            fiatSuccess = historicalRates.length;
          }
        } catch (error) {
          console.error('Historical FIAT rates fetch failed:', error);
          errors.push(`Historical FIAT: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Attempt to fetch historical crypto prices from API Ninjas (Premium feature)
      if (apiStatus.crypto && cryptoCurrencies.length > 0) {
        let premiumRequired = false;
        
        for (const crypto of cryptoCurrencies) {
          try {
            const price = await this.fetchHistoricalCryptoPrice(crypto, date);
            currencyRates.push({
              code: crypto,
              name: this.getCurrencyName(crypto),
              rate: typeof price === 'number' ? price : parseFloat(String(price)) || 0,
              type: 'crypto',
              lastUpdated: historicalTime
            });
            cryptoSuccess++;
          } catch (error) {
            if (error instanceof Error && error.message.includes('premium subscription')) {
              premiumRequired = true;
              // Fallback to current price with historical timestamp as a compromise
              try {
                const currentPrice = await this.fetchCryptoPrice(crypto);
                currencyRates.push({
                  code: crypto,
                  name: this.getCurrencyName(crypto),
                  rate: typeof currentPrice === 'number' ? currentPrice : parseFloat(String(currentPrice)) || 0,
                  type: 'crypto',
                  lastUpdated: historicalTime
                });
                cryptoSuccess++;
              } catch (currentPriceError) {
                console.warn(`Failed to fetch current price fallback for ${crypto}:`, currentPriceError);
              }
            } else {
              console.warn(`Failed to fetch historical price for ${crypto}:`, error);
            }
          }
        }
        
        if (premiumRequired) {
          errors.push('Historical crypto data requires API Ninjas Premium (using current prices as fallback)');
        }
        
        console.log(`✅ Crypto Historical: Processed ${cryptoSuccess} crypto currencies for ${date}${premiumRequired ? ' (premium required, used current prices)' : ''}`);
      }

      const totalSuccess = fiatSuccess + cryptoSuccess;

      if (totalSuccess === 0) {
        return {
          success: false,
          error: `Failed to fetch historical data for ${date}`
        };
      }

      const result = {
        success: true,
        data: currencyRates,
        rateLimit: {
          limitMonth: 15000,
          remainingMonth: 14000
        }
      };

      if (errors.length > 0) {
        return {
          ...result,
          error: `Historical data for ${date}: ${totalSuccess} currencies (${fiatSuccess} FIAT historical, ${cryptoSuccess} crypto processed). ${errors.join('; ')}`
        };
      }

      return result;

    } catch (error) {
      console.error('CurrencyAPIService.getHistoricalRates error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}