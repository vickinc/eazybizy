import { CurrencyService } from '../currencyService';
import { SettingsStorageService } from '../../storage/settingsStorageService';

// Mock SettingsStorageService
jest.mock('../../storage/settingsStorageService');

const mockDefaultRates = {
  'USD': 1,
  'EUR': 0.9,
  'GBP': 0.8,
};

describe('CurrencyService', () => {
  beforeEach(() => {
    // Reset mocks and cache before each test
    (SettingsStorageService.getExchangeRates as jest.Mock).mockClear();
    CurrencyService.invalidateCache();
    // Default mock implementation
    (SettingsStorageService.getExchangeRates as jest.Mock).mockReturnValue(mockDefaultRates);
  });

  describe('formatAmount', () => {
    it('should format amount with default USD currency and locale', () => {
      expect(CurrencyService.formatAmount(1234.56)).toBe('$1,234.56');
    });

    it('should format amount with specified currency', () => {
      expect(CurrencyService.formatAmount(1234.56, 'EUR')).toBe('€1,234.56'); // Assuming EUR symbol
    });

    it('should format amount with specified currency and locale', () => {
      // Note: Node's Intl support might need full ICU data for all locales/currencies
      // This test might behave differently in different Node environments.
      // For simplicity, using 'en-US' which is generally well-supported.
      expect(CurrencyService.formatAmount(1234.56, 'GBP', 'en-GB')).toBe('£1,234.56');
    });

    it('should handle invalid currency code gracefully by prefixing', () => {
      expect(CurrencyService.formatAmount(100, 'XYZ')).toBe('XYZ 100.00');
    });

    it('should format without currency symbol if currency is not provided', () => {
      expect(CurrencyService.formatAmount(500)).toBe('500.00');
    });
  });

  describe('getExchangeRates with caching', () => {
    it('should call SettingsStorageService.getExchangeRates on first call', () => {
      CurrencyService.getExchangeRates();
      expect(SettingsStorageService.getExchangeRates).toHaveBeenCalledTimes(1);
    });

    it('should use cache for subsequent calls within CACHE_DURATION', () => {
      CurrencyService.getExchangeRates(); // First call
      CurrencyService.getExchangeRates(); // Second call
      expect(SettingsStorageService.getExchangeRates).toHaveBeenCalledTimes(1);
    });

    it('should call SettingsStorageService.getExchangeRates again after cache invalidation', () => {
      CurrencyService.getExchangeRates(); // First call
      CurrencyService.invalidateCache();
      CurrencyService.getExchangeRates(); // Call after invalidation
      expect(SettingsStorageService.getExchangeRates).toHaveBeenCalledTimes(2);
    });

    it('should call SettingsStorageService.getExchangeRates again after CACHE_DURATION', () => {
      jest.useFakeTimers();
      CurrencyService.getExchangeRates(); // First call
      expect(SettingsStorageService.getExchangeRates).toHaveBeenCalledTimes(1);

      // Advance time beyond cache duration
      jest.advanceTimersByTime(CurrencyService['CACHE_DURATION'] + 1000);

      CurrencyService.getExchangeRates(); // Call after cache duration
      expect(SettingsStorageService.getExchangeRates).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });
  });

  describe('convertToUSD', () => {
    it('should convert EUR to USD correctly', () => {
      expect(CurrencyService.convertToUSD(100, 'EUR')).toBeCloseTo(100 / 0.9); // 1 EUR = 1/0.9 USD if rate is 0.9
    });

    it('should return original amount if currency is USD', () => {
      expect(CurrencyService.convertToUSD(100, 'USD')).toBe(100);
    });

    it('should handle unknown currency by returning original amount', () => {
      (SettingsStorageService.getExchangeRates as jest.Mock).mockReturnValue({ USD: 1 });
      expect(CurrencyService.convertToUSD(100, 'XYZ')).toBe(100);
    });
  });

  describe('convertCurrency', () => {
    it('should convert EUR to GBP correctly', () => {
      // USD is base. EUR rate 0.9 (1 EUR = 1/0.9 USD). GBP rate 0.8 (1 GBP = 1/0.8 USD)
      // 100 EUR = 100 * (1/0.9) USD
      // USD amount in GBP = (100 * (1/0.9)) / (1/0.8) = 100 * (1/0.9) * 0.8 = 100 * 0.8 / 0.9
      expect(CurrencyService.convertCurrency(100, 'EUR', 'GBP')).toBeCloseTo(100 * (mockDefaultRates.USD/mockDefaultRates.EUR) * mockDefaultRates.GBP);
    });

    it('should return original amount if fromCurrency and toCurrency are the same', () => {
      expect(CurrencyService.convertCurrency(100, 'EUR', 'EUR')).toBe(100);
    });

    it('should handle unknown fromCurrency by returning original amount', () => {
      expect(CurrencyService.convertCurrency(100, 'XYZ', 'USD')).toBe(100);
    });

    it('should handle unknown toCurrency by returning original amount', () => {
       expect(CurrencyService.convertCurrency(100, 'USD', 'XYZ')).toBe(100);
    });
  });
});
