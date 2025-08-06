import { CurrencyRate } from '@/types';

export interface NewCurrencyRate {
  code: string;
  name: string;
  rate: number;
  type: 'fiat' | 'crypto';
}

export interface EnhancedCurrencyRate extends CurrencyRate {
  formattedRate: string;
  isBase: boolean;
  rateDescription: string;
  lastUpdatedFormatted: string;
  isDisabled: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export interface CurrencyRatesSummary {
  totalFiatCurrencies: number;
  totalCryptoCurrencies: number;
  lastUpdated: string;
  baseCurrency: string;
}

export interface CurrencyRatesData {
  enhancedFiatRates: EnhancedCurrencyRate[];
  enhancedCryptoRates: EnhancedCurrencyRate[];
  summary: CurrencyRatesSummary;
}

export class CurrencyRatesBusinessService {
  // Fixed timestamp to ensure consistent SSR/client hydration
  static readonly DEFAULT_LAST_UPDATED = '2025-01-01T00:00:00.000Z';
  
  static readonly DEFAULT_FIAT_CURRENCIES: CurrencyRate[] = [
    { code: 'USD', name: 'US Dollar', rate: 1, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'EUR', name: 'Euro', rate: 1.09, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'GBP', name: 'British Pound', rate: 1.27, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'JPY', name: 'Japanese Yen', rate: 0.0067, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'AUD', name: 'Australian Dollar', rate: 0.66, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'CAD', name: 'Canadian Dollar', rate: 0.74, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'CHF', name: 'Swiss Franc', rate: 1.12, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'CNY', name: 'Chinese Yuan', rate: 0.14, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'SEK', name: 'Swedish Krona', rate: 0.096, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'NZD', name: 'New Zealand Dollar', rate: 0.60, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'MXN', name: 'Mexican Peso', rate: 0.058, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'SGD', name: 'Singapore Dollar', rate: 0.74, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'HKD', name: 'Hong Kong Dollar', rate: 0.13, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'NOK', name: 'Norwegian Krone', rate: 0.092, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'DKK', name: 'Danish Krone', rate: 0.146, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'PLN', name: 'Polish Zloty', rate: 0.24, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'CZK', name: 'Czech Koruna', rate: 0.044, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'HUF', name: 'Hungarian Forint', rate: 0.0027, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'ILS', name: 'Israeli Shekel', rate: 0.27, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'CLP', name: 'Chilean Peso', rate: 0.0010, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'PHP', name: 'Philippine Peso', rate: 0.018, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'AED', name: 'UAE Dirham', rate: 0.27, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'COP', name: 'Colombian Peso', rate: 0.00025, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'SAR', name: 'Saudi Riyal', rate: 0.27, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'MYR', name: 'Malaysian Ringgit', rate: 0.22, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'RON', name: 'Romanian Leu', rate: 0.22, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'THB', name: 'Thai Baht', rate: 0.028, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'TRY', name: 'Turkish Lira', rate: 0.034, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'BRL', name: 'Brazilian Real', rate: 0.17, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'TWD', name: 'Taiwan Dollar', rate: 0.031, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'ZAR', name: 'South African Rand', rate: 0.055, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'KRW', name: 'South Korean Won', rate: 0.00075, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'INR', name: 'Indian Rupee', rate: 0.012, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'RUB', name: 'Russian Ruble', rate: 0.011, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'BGN', name: 'Bulgarian Lev', rate: 0.56, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'HRK', name: 'Croatian Kuna', rate: 0.145, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'IDR', name: 'Indonesian Rupiah', rate: 0.000065, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'ISK', name: 'Icelandic Krona', rate: 0.0072, type: 'fiat', lastUpdated: this.DEFAULT_LAST_UPDATED }
  ];

  static readonly DEFAULT_CRYPTO_CURRENCIES: CurrencyRate[] = [
    { code: 'BTC', name: 'Bitcoin', rate: 105000, type: 'crypto', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'ETH', name: 'Ethereum', rate: 3200, type: 'crypto', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'SOL', name: 'Solana', rate: 190, type: 'crypto', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'BNB', name: 'Binance Coin', rate: 650, type: 'crypto', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'TRX', name: 'TRON', rate: 0.25, type: 'crypto', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'USDT', name: 'Tether', rate: 1, type: 'crypto', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'USDC', name: 'USD Coin', rate: 1, type: 'crypto', lastUpdated: this.DEFAULT_LAST_UPDATED },
    { code: 'BUSD', name: 'Binance USD', rate: 1, type: 'crypto', lastUpdated: this.DEFAULT_LAST_UPDATED }
  ];

  static readonly BASE_CURRENCY = 'USD';

  static validateCurrencyRate(rate: NewCurrencyRate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rate.code || !rate.code.trim()) {
      errors.push('Currency code is required');
    } else if (rate.code.length !== 3 && rate.code.length !== 4) {
      errors.push('Currency code must be 3-4 characters');
    }

    if (!rate.name || !rate.name.trim()) {
      errors.push('Currency name is required');
    }

    if (rate.rate === undefined || rate.rate === null) {
      errors.push('Exchange rate is required');
    } else if (isNaN(rate.rate) || rate.rate < 0) {
      errors.push('Exchange rate must be a positive number');
    }

    if (!rate.type || (rate.type !== 'fiat' && rate.type !== 'crypto')) {
      errors.push('Currency type must be either "fiat" or "crypto"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static createEnhancedCurrencyRate(rate: CurrencyRate, validationError?: string): EnhancedCurrencyRate {
    const isBase = rate.code === this.BASE_CURRENCY;
    const hasError = !!validationError;
    
    // Ensure rate is a valid number
    const safeRate = typeof rate.rate === 'number' ? rate.rate : 0;
    
    return {
      ...rate,
      rate: safeRate, // Ensure the rate is always a number
      formattedRate: safeRate.toLocaleString('en-US'),
      isBase,
      rateDescription: rate.type === 'crypto' 
        ? `1 ${rate.code} = ${safeRate.toLocaleString('en-US')} USD`
        : safeRate !== 0 
          ? `1 USD = ${safeRate.toLocaleString('en-US')} ${rate.code}`
          : `1 USD = 0 ${rate.code}`,
      lastUpdatedFormatted: new Date(rate.lastUpdated).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) + ' ' + new Date(rate.lastUpdated).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      isDisabled: isBase, // Base currency should be disabled for editing
      hasError,
      errorMessage: validationError
    };
  }

  static processRatesData(
    fiatRates: CurrencyRate[],
    cryptoRates: CurrencyRate[],
    validationErrors?: Map<string, string>
  ): CurrencyRatesData {
    const enhancedFiatRates = fiatRates.map(rate => 
      this.createEnhancedCurrencyRate(rate, validationErrors?.get(rate.code))
    );
    const enhancedCryptoRates = cryptoRates.map(rate => 
      this.createEnhancedCurrencyRate(rate, validationErrors?.get(rate.code))
    );

    const allRates = [...fiatRates, ...cryptoRates];
    const lastUpdated = allRates.length > 0 
      ? new Date(Math.max(...allRates.map(r => new Date(r.lastUpdated).getTime()))).toLocaleString()
      : 'Never';

    const summary: CurrencyRatesSummary = {
      totalFiatCurrencies: fiatRates.length,
      totalCryptoCurrencies: cryptoRates.length,
      lastUpdated,
      baseCurrency: this.BASE_CURRENCY
    };

    return {
      enhancedFiatRates,
      enhancedCryptoRates,
      summary
    };
  }

  static updateCurrencyRate(
    rates: CurrencyRate[],
    code: string,
    newRate: number
  ): CurrencyRate[] {
    const updatedDate = new Date().toISOString();
    return rates.map(rate =>
      rate.code === code
        ? { ...rate, rate: newRate, lastUpdated: updatedDate }
        : rate
    );
  }

  static resetToDefaults(type: 'fiat' | 'crypto'): CurrencyRate[] {
    return type === 'fiat' 
      ? [...this.DEFAULT_FIAT_CURRENCIES]
      : [...this.DEFAULT_CRYPTO_CURRENCIES];
  }

  static formatCurrencyRate(rate: number, type: 'fiat' | 'crypto'): string {
    if (type === 'crypto' && rate >= 1000) {
      return rate.toLocaleString('en-US');
    }
    return rate.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }

  static validateRateInput(value: string): boolean {
    return /^\d*\.?\d*$/.test(value) || value === '';
  }

  static parseRateInput(value: string): number {
    const numericValue = value.replace(/,/g, '');
    return parseFloat(numericValue) || 0;
  }

  static generatePageTitle(): string {
    return 'Currency Rates';
  }

  static generatePageDescription(): string {
    return 'Manage exchange rates for FIAT and crypto currencies';
  }

  static createCurrencyRate(newRate: NewCurrencyRate): CurrencyRate {
    return {
      ...newRate,
      lastUpdated: this.DEFAULT_LAST_UPDATED
    };
  }

  static isBaseRate(code: string): boolean {
    return code === this.BASE_CURRENCY;
  }

  static validateRateValue(value: string): { isValid: boolean; error?: string } {
    if (!value || value.trim() === '') {
      return { isValid: false, error: 'Rate cannot be empty' };
    }

    const numericValue = parseFloat(value);
    
    if (isNaN(numericValue)) {
      return { isValid: false, error: 'Rate must be a valid number' };
    }

    if (numericValue < 0) {
      return { isValid: false, error: 'Rate cannot be negative' };
    }

    if (numericValue === 0) {
      return { isValid: false, error: 'Rate cannot be zero' };
    }

    return { isValid: true };
  }

  static getDefaultFiatCurrencies(): CurrencyRate[] {
    return this.DEFAULT_FIAT_CURRENCIES.map(rate => ({
      ...rate,
      lastUpdated: this.DEFAULT_LAST_UPDATED
    }));
  }

  static getDefaultCryptoCurrencies(): CurrencyRate[] {
    return this.DEFAULT_CRYPTO_CURRENCIES.map(rate => ({
      ...rate,
      lastUpdated: this.DEFAULT_LAST_UPDATED
    }));
  }

  /**
   * Update currency rates from API data
   * @param currentRates Current currency rates
   * @param apiRates Currency rates from API
   * @param type Type of currencies to update ('fiat' or 'crypto')
   */
  static updateRatesFromAPI(
    currentRates: CurrencyRate[],
    apiRates: CurrencyRate[],
    type: 'fiat' | 'crypto'
  ): CurrencyRate[] {
    const updatedRates = [...currentRates];

    // Update existing rates with API data
    apiRates.forEach(apiRate => {
      const existingIndex = updatedRates.findIndex(rate => 
        rate.code === apiRate.code && rate.type === type
      );

      if (existingIndex !== -1) {
        // Update existing rate
        updatedRates[existingIndex] = {
          ...updatedRates[existingIndex],
          rate: apiRate.rate,
          lastUpdated: apiRate.lastUpdated
        };
      } else {
        // Add new rate if it doesn't exist
        updatedRates.push({
          ...apiRate,
          type
        });
      }
    });

    return updatedRates;
  }

  /**
   * Merge API rates with existing rates, preserving user customizations
   * @param fiatRates Current fiat rates
   * @param cryptoRates Current crypto rates
   * @param apiRates New rates from API
   */
  static mergeWithAPIRates(
    fiatRates: CurrencyRate[],
    cryptoRates: CurrencyRate[],
    apiRates: CurrencyRate[]
  ): { fiatRates: CurrencyRate[]; cryptoRates: CurrencyRate[] } {
    // Separate API rates by type
    const apiFiatRates = apiRates.filter(rate => rate.type === 'fiat');
    const apiCryptoRates = apiRates.filter(rate => rate.type === 'crypto');

    // Update rates with API data
    const updatedFiatRates = this.updateRatesFromAPI(fiatRates, apiFiatRates, 'fiat');
    const updatedCryptoRates = this.updateRatesFromAPI(cryptoRates, apiCryptoRates, 'crypto');

    return {
      fiatRates: updatedFiatRates,
      cryptoRates: updatedCryptoRates
    };
  }

  /**
   * Create a currency rate update summary
   * @param oldRates Previous rates
   * @param newRates Updated rates
   */
  static createUpdateSummary(
    oldRates: CurrencyRate[],
    newRates: CurrencyRate[]
  ): {
    updated: number;
    added: number;
    total: number;
    lastUpdated: string;
  } {
    let updated = 0;
    let added = 0;

    newRates.forEach(newRate => {
      const oldRate = oldRates.find(rate => rate.code === newRate.code);
      if (oldRate) {
        if (oldRate.rate !== newRate.rate || oldRate.lastUpdated !== newRate.lastUpdated) {
          updated++;
        }
      } else {
        added++;
      }
    });

    return {
      updated,
      added,
      total: newRates.length,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Validate API rate data
   * @param rates Array of currency rates from API
   */
  static validateAPIRates(rates: CurrencyRate[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(rates)) {
      errors.push('Rates data must be an array');
      return { isValid: false, errors };
    }

    rates.forEach((rate, index) => {
      if (!rate.code || typeof rate.code !== 'string') {
        errors.push(`Rate at index ${index}: Invalid currency code`);
      }

      if (typeof rate.rate !== 'number' || rate.rate <= 0) {
        errors.push(`Rate at index ${index}: Invalid rate value`);
      }

      if (!rate.lastUpdated || typeof rate.lastUpdated !== 'string') {
        errors.push(`Rate at index ${index}: Invalid lastUpdated timestamp`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get currencies that need updating (haven't been updated in X hours)
   * @param rates Current currency rates
   * @param hoursThreshold Hours since last update (default: 24)
   */
  static getCurrenciesNeedingUpdate(
    rates: CurrencyRate[],
    hoursThreshold: number = 24
  ): CurrencyRate[] {
    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - hoursThreshold);

    return rates.filter(rate => {
      const lastUpdated = new Date(rate.lastUpdated);
      return lastUpdated < thresholdTime;
    });
  }

  /**
   * Generate page title with API status
   */
  static generatePageTitleWithAPI(isAPIConfigured: boolean): string {
    const baseTitle = this.generatePageTitle();
    return isAPIConfigured 
      ? `${baseTitle} - Live Rates Available`
      : `${baseTitle} - Manual Rates Only`;
  }

  /**
   * Generate page description with API status
   */
  static generatePageDescriptionWithAPI(isAPIConfigured: boolean): string {
    const baseDescription = this.generatePageDescription();
    return isAPIConfigured
      ? `${baseDescription} Get live exchange rates automatically from external API.`
      : `${baseDescription} Configure API key to get live rates automatically.`;
  }
}