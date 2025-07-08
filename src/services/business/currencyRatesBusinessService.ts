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
  static readonly DEFAULT_FIAT_CURRENCIES: CurrencyRate[] = [
    { code: 'USD', name: 'US Dollar', rate: 1, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'EUR', name: 'Euro', rate: 1.09, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'GBP', name: 'British Pound', rate: 1.27, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'JPY', name: 'Japanese Yen', rate: 0.0067, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'AUD', name: 'Australian Dollar', rate: 0.66, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'CAD', name: 'Canadian Dollar', rate: 0.74, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'CHF', name: 'Swiss Franc', rate: 1.12, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'CNY', name: 'Chinese Yuan', rate: 0.14, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'SEK', name: 'Swedish Krona', rate: 0.096, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'NZD', name: 'New Zealand Dollar', rate: 0.60, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'MXN', name: 'Mexican Peso', rate: 0.058, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'SGD', name: 'Singapore Dollar', rate: 0.74, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'HKD', name: 'Hong Kong Dollar', rate: 0.13, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'NOK', name: 'Norwegian Krone', rate: 0.092, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'DKK', name: 'Danish Krone', rate: 0.146, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'PLN', name: 'Polish Zloty', rate: 0.24, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'CZK', name: 'Czech Koruna', rate: 0.044, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'HUF', name: 'Hungarian Forint', rate: 0.0027, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'ILS', name: 'Israeli Shekel', rate: 0.27, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'CLP', name: 'Chilean Peso', rate: 0.0010, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'PHP', name: 'Philippine Peso', rate: 0.018, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'AED', name: 'UAE Dirham', rate: 0.27, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'COP', name: 'Colombian Peso', rate: 0.00025, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'SAR', name: 'Saudi Riyal', rate: 0.27, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'MYR', name: 'Malaysian Ringgit', rate: 0.22, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'RON', name: 'Romanian Leu', rate: 0.22, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'THB', name: 'Thai Baht', rate: 0.028, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'TRY', name: 'Turkish Lira', rate: 0.034, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'BRL', name: 'Brazilian Real', rate: 0.17, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'TWD', name: 'Taiwan Dollar', rate: 0.031, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'ZAR', name: 'South African Rand', rate: 0.055, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'KRW', name: 'South Korean Won', rate: 0.00075, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'INR', name: 'Indian Rupee', rate: 0.012, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'RUB', name: 'Russian Ruble', rate: 0.011, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'BGN', name: 'Bulgarian Lev', rate: 0.56, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'HRK', name: 'Croatian Kuna', rate: 0.145, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'IDR', name: 'Indonesian Rupiah', rate: 0.000065, type: 'fiat', lastUpdated: new Date().toISOString() },
    { code: 'ISK', name: 'Icelandic Krona', rate: 0.0072, type: 'fiat', lastUpdated: new Date().toISOString() }
  ];

  static readonly DEFAULT_CRYPTO_CURRENCIES: CurrencyRate[] = [
    { code: 'BTC', name: 'Bitcoin', rate: 105000, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'ETH', name: 'Ethereum', rate: 3200, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'BNB', name: 'Binance Coin', rate: 650, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'ADA', name: 'Cardano', rate: 1.05, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'XRP', name: 'Ripple', rate: 2.45, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'SOL', name: 'Solana', rate: 190, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'DOT', name: 'Polkadot', rate: 8.5, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'DOGE', name: 'Dogecoin', rate: 0.38, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'MATIC', name: 'Polygon', rate: 0.45, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'LTC', name: 'Litecoin', rate: 110, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'BCH', name: 'Bitcoin Cash', rate: 480, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'LINK', name: 'Chainlink', rate: 22.5, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'XLM', name: 'Stellar', rate: 0.38, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'VET', name: 'VeChain', rate: 0.055, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'TRX', name: 'TRON', rate: 0.25, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'USDT', name: 'Tether', rate: 1, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'USDC', name: 'USD Coin', rate: 1, type: 'crypto', lastUpdated: new Date().toISOString() },
    { code: 'BUSD', name: 'Binance USD', rate: 1, type: 'crypto', lastUpdated: new Date().toISOString() }
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
    
    return {
      ...rate,
      formattedRate: rate.rate.toLocaleString('en-US'),
      isBase,
      rateDescription: rate.type === 'crypto' 
        ? `1 ${rate.code} = ${rate.rate.toLocaleString('en-US')} USD`
        : `1 ${rate.code} = ${rate.rate.toLocaleString('en-US')} USD`,
      lastUpdatedFormatted: new Date(rate.lastUpdated).toLocaleString(),
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
      lastUpdated: new Date().toISOString()
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
      lastUpdated: new Date().toISOString()
    }));
  }

  static getDefaultCryptoCurrencies(): CurrencyRate[] {
    return this.DEFAULT_CRYPTO_CURRENCIES.map(rate => ({
      ...rate,
      lastUpdated: new Date().toISOString()
    }));
  }
}