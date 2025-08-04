import { SettingsStorageService } from '../storage/settingsStorageService';

/**
 * Provides currency conversion, formatting utilities, and currency constants.
 * It caches exchange rates to minimize redundant lookups from storage.
 */
export class CurrencyService {
  /**
   * Supported currencies list for form selection
   */
  static readonly SUPPORTED_CURRENCIES = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
    'MXN', 'SGD', 'HKD', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'ILS', 'CLP',
    'PHP', 'AED', 'COP', 'SAR', 'MYR', 'RON', 'THB', 'TRY', 'BRL', 'TWD',
    'ZAR', 'KRW', 'INR', 'RUB', 'BGN', 'HRK', 'IDR', 'ISK'
  ] as const;

  /**
   * Default currency for new invoices
   */
  static readonly DEFAULT_CURRENCY = 'USD';
  private static ratesCache: { [key: string]: number } | null = null;
  private static cacheTimestamp: number | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Retrieves exchange rates, utilizing a cache.
   * Rates are fetched from SettingsStorageService if cache is stale or empty.
   * The rates are assumed to be relative to USD, where USD is 1.
   * (e.g., EUR: 0.9 means 1 USD = 0.9 EUR, or 1 EUR = 1/0.9 USD).
   * The DEFAULT_EXCHANGE_RATES in SettingsStorageService implies: 1 Unit of Foreign Currency = X USD (e.g. EUR: 1.09 means 1 EUR = 1.09 USD)
   * This service's implementation and tests align with: Rate value means "USD per 1 unit of foreign currency".
   * @returns An object mapping currency codes to their rates against USD.
   */
  static getExchangeRates(): { [key: string]: number } {
    const now = Date.now();
    if (this.ratesCache && this.cacheTimestamp && (now - this.cacheTimestamp < this.CACHE_DURATION)) {
      return this.ratesCache;
    }

    this.ratesCache = SettingsStorageService.getExchangeRates();
    this.cacheTimestamp = now;
    return this.ratesCache;
  }

  /**
   * Converts an amount from a given currency to USD.
   * Uses cached exchange rates where the rate is "USD per 1 unit of foreign currency".
   * @param amount The amount to convert.
   * @param fromCurrency The currency code to convert from (e.g., "EUR").
   * @returns The equivalent amount in USD. Returns original amount if rate is not found.
   * Example: 100 EUR with rate { EUR: 1.10 } becomes 110 USD.
   */
  static convertToUSD(amount: number, fromCurrency: string): number {
    try {
      if (fromCurrency === 'USD') return amount;
      const rates = this.getExchangeRates();
      const rate = rates[fromCurrency]; // USD per unit of fromCurrency

      if (typeof rate !== 'number') {
        console.warn(`Exchange rate not found for ${fromCurrency}. Returning original amount.`);
        return amount;
      }
      return amount * rate;
    } catch (error) {
      console.error(`Error converting ${amount} ${fromCurrency} to USD:`, error);
      return amount; // Return original amount on error
    }
  }

  /**
   * Converts an amount from one currency to another, via USD as a base.
   * Uses cached exchange rates where rates are "USD per 1 unit of foreign currency".
   * @param amount The amount to convert.
   * @param fromCurrency The currency code to convert from (e.g., "EUR").
   * @param toCurrency The currency code to convert to (e.g., "GBP").
   * @returns The equivalent amount in the target currency. Returns original amount if rates are not found.
   */
  static convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;

    const rates = this.getExchangeRates(); // Rates are USD per unit of foreign currency
    const fromRateToUSD = rates[fromCurrency]; // USD per unit of fromCurrency
    const toRateToUSD = rates[toCurrency];   // USD per unit of toCurrency

    if (typeof fromRateToUSD !== 'number') {
      console.warn(`Exchange rate not found for source currency ${fromCurrency}. Returning original amount.`);
      return amount;
    }
    if (typeof toRateToUSD !== 'number') {
      console.warn(`Exchange rate not found for target currency ${toCurrency}. Returning original amount.`);
      // If target is USD and rate is missing, it implies USD is not in rates or is not 1.
      // This case should ideally not happen if USD is always 1.
      if (toCurrency === 'USD') return amount * fromRateToUSD; // Already converted to USD
      return amount;
    }

    const usdAmount = amount * fromRateToUSD; // Amount in USD

    if (toCurrency === 'USD') return usdAmount; // If target is USD, we are done

    // To convert USD to toCurrency: amountInToCurrency = usdAmount / rateOfToCurrencyToUSD
    // Example: 110 USD to EUR (rate EUR: 1.10 USD per EUR). 110 USD / 1.10 = 100 EUR.
    const convertedAmount = usdAmount / toRateToUSD;

    return convertedAmount;
  }

  /**
   * Formats a numerical amount as a currency string.
   * @param amount The amount to format.
   * @param currency Optional currency code (e.g., "USD", "EUR"). If provided, uses currency style.
   * @param locale Optional locale string (e.g., "en-US", "de-DE"). Defaults to "en-US".
   * @returns A formatted currency string. Handles invalid currency codes by prefixing.
   */
  static formatAmount(amount: number, currency?: string, locale: string = 'en-US'): string {
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    if (currency) {
      try {
        // Validate currency code for style: 'currency'
        new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(0);
        options.style = 'currency';
        options.currency = currency;
      } catch {
        // console.warn(`Invalid currency code '${currency}' for Intl.NumberFormat. Formatting as plain number with prefix.`);
        return `${currency} ${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }

    return amount.toLocaleString(locale, options);
  }

  /**
   * Invalidates the cached exchange rates, forcing a fresh fetch on the next call to getExchangeRates.
   */
  static invalidateCache(): void {
    this.ratesCache = null;
    this.cacheTimestamp = null;
  }

  /**
   * Validates if a currency code is supported
   */
  static isSupportedCurrency(currency: string): boolean {
    return this.SUPPORTED_CURRENCIES.includes(currency as typeof this.SUPPORTED_CURRENCIES[number]);
  }

  /**
   * Gets the list of supported currencies for UI dropdowns
   */
  static getSupportedCurrencies(): readonly string[] {
    return this.SUPPORTED_CURRENCIES;
  }

  /**
   * Calculates invoice totals with currency validation
   */
  static calculateInvoiceTotals(
    items: Array<{ quantity: number; unitPrice: number; currency?: string }>,
    taxRatePercent: number,
    invoiceCurrency: string
  ): { subtotal: number; taxAmount: number; totalAmount: number; currencyMismatch: boolean } {
    const subtotal = 0;
    let currencyMismatch = false;

    // Calculate subtotal and check for currency mismatches
    for (const item of items) {
      const itemCurrency = item.currency || this.DEFAULT_CURRENCY;
      if (itemCurrency !== invoiceCurrency) {
        currencyMismatch = true;
      }
      
      const quantity = isNaN(item.quantity) ? 0 : item.quantity;
      const unitPrice = isNaN(item.unitPrice) ? 0 : item.unitPrice;
      subtotal += quantity * unitPrice;
    }

    const validTaxRate = isNaN(taxRatePercent) ? 0 : taxRatePercent;
    const taxAmount = subtotal * (validTaxRate / 100);
    const totalAmount = subtotal + taxAmount;

    return {
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
      totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
      currencyMismatch
    };
  }
}
