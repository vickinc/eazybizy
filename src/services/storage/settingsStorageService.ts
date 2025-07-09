import { AppSettings, IFRSSettings, CompanySettings, UserPreferences, DEFAULT_IFRS_SETTINGS, DEFAULT_COMPANY_SETTINGS, DEFAULT_USER_PREFERENCES } from '../../types/settings.types';
import { CurrencyRate } from '../../types/currency.types';

const FIAT_RATES_STORAGE_KEY = 'app-fiat-rates';
const CRYPTO_RATES_STORAGE_KEY = 'app-crypto-rates';
const IFRS_SETTINGS_KEY = 'app-ifrs-settings';
const COMPANY_SETTINGS_KEY = 'app-company-settings';
const USER_PREFERENCES_KEY = 'app-user-preferences';
const APP_SETTINGS_KEY = 'app-settings';

const DEFAULT_EXCHANGE_RATES = {
  'USD': 1, 'EUR': 1.09, 'GBP': 1.27, 'JPY': 0.0067, 'AUD': 0.66, 'CAD': 0.74,
  'CHF': 1.12, 'CNY': 0.14, 'SEK': 0.096, 'NZD': 0.60, 'MXN': 0.058, 'SGD': 0.74,
  'HKD': 0.13, 'NOK': 0.092, 'DKK': 0.146, 'PLN': 0.24, 'CZK': 0.044, 'HUF': 0.0027,
  'ILS': 0.27, 'CLP': 0.0010, 'PHP': 0.018, 'AED': 0.27, 'COP': 0.00025, 'SAR': 0.27,
  'MYR': 0.22, 'RON': 0.22, 'THB': 0.028, 'TRY': 0.034, 'BRL': 0.17, 'TWD': 0.031,
  'ZAR': 0.055, 'KRW': 0.00075, 'INR': 0.012, 'RUB': 0.011, 'BGN': 0.56, 'HRK': 0.145,
  'IDR': 0.000065, 'ISK': 0.0072
};

export class SettingsStorageService {
  static getExchangeRates(): { [key: string]: number } {
    let rates: { [key: string]: number } = { 'USD': 1 };
    const loadedFromStorage = false;

    try {
      // SSR guard: Check if we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return DEFAULT_EXCHANGE_RATES;
      }

      const fiatRatesRaw = localStorage.getItem(FIAT_RATES_STORAGE_KEY);
      if (fiatRatesRaw) {
        const fiatData = JSON.parse(fiatRatesRaw);
        fiatData.forEach((currency: CurrencyRate) => {
          rates[currency.code] = currency.rate;
        });
        loadedFromStorage = true;
      }

      const cryptoRatesRaw = localStorage.getItem(CRYPTO_RATES_STORAGE_KEY);
      if (cryptoRatesRaw) {
        const cryptoData = JSON.parse(cryptoRatesRaw);
        cryptoData.forEach((currency: CurrencyRate) => {
          rates[currency.code] = currency.rate;
        });
        loadedFromStorage = true;
      }

      if (loadedFromStorage && Object.keys(rates).length > 1) { // USD is always there
        return rates;
      }
    } catch (error) {
      console.error('Error loading exchange rates from localStorage:', error);
      // Fall through to default if error or nothing substantial loaded
    }

    // If nothing loaded from storage or error occurred, return defaults
    // Merge with USD:1 to ensure it's always present.
    return { ...DEFAULT_EXCHANGE_RATES, ...rates };
  }

  // Assuming fiat and crypto rates are saved separately by whatever mechanism updates them
  // For now, this service only reads them. Saving would imply a source for these rates.
  // If these rates are meant to be user-configurable within this app, then save methods would be needed.
  // For example:
  static saveFiatRates(rates: CurrencyRate[]): void {
    try {
      localStorage.setItem(FIAT_RATES_STORAGE_KEY, JSON.stringify(rates));
    } catch (error) {
      console.error('Error saving fiat rates to localStorage:', error);
    }
  }

  static saveCryptoRates(rates: CurrencyRate[]): void {
    try {
      localStorage.setItem(CRYPTO_RATES_STORAGE_KEY, JSON.stringify(rates));
    } catch (error) {
      console.error('Error saving crypto rates to localStorage:', error);
    }
  }

  // IFRS Settings Management
  static getIFRSSettings(): IFRSSettings {
    try {
      // SSR guard: Check if we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return DEFAULT_IFRS_SETTINGS;
      }
      const settingsRaw = localStorage.getItem(IFRS_SETTINGS_KEY);
      if (settingsRaw) {
        const settings = JSON.parse(settingsRaw);
        return { ...DEFAULT_IFRS_SETTINGS, ...settings };
      }
    } catch (error) {
      console.error('Error loading IFRS settings from localStorage:', error);
    }
    return DEFAULT_IFRS_SETTINGS;
  }

  static saveIFRSSettings(settings: IFRSSettings): void {
    try {
      // SSR guard: Check if we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return; // Do nothing during SSR
      }
      const updatedSettings = { ...settings, updatedAt: new Date().toISOString() };
      localStorage.setItem(IFRS_SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving IFRS settings to localStorage:', error);
      throw error;
    }
  }

  // Company Settings Management
  static getCompanySettings(): CompanySettings {
    try {
      // SSR guard: Check if we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return DEFAULT_COMPANY_SETTINGS;
      }
      const settingsRaw = localStorage.getItem(COMPANY_SETTINGS_KEY);
      if (settingsRaw) {
        const settings = JSON.parse(settingsRaw);
        return { ...DEFAULT_COMPANY_SETTINGS, ...settings };
      }
    } catch (error) {
      console.error('Error loading company settings from localStorage:', error);
    }
    return DEFAULT_COMPANY_SETTINGS;
  }

  static saveCompanySettings(settings: CompanySettings): void {
    try {
      // SSR guard: Check if we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return; // Do nothing during SSR
      }
      const updatedSettings = { ...settings, updatedAt: new Date().toISOString() };
      localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving company settings to localStorage:', error);
      throw error;
    }
  }

  // User Preferences Management
  static getUserPreferences(): UserPreferences {
    try {
      const preferencesRaw = localStorage.getItem(USER_PREFERENCES_KEY);
      if (preferencesRaw) {
        const preferences = JSON.parse(preferencesRaw);
        return { ...DEFAULT_USER_PREFERENCES, ...preferences };
      }
    } catch (error) {
      console.error('Error loading user preferences from localStorage:', error);
    }
    return DEFAULT_USER_PREFERENCES;
  }

  static saveUserPreferences(preferences: UserPreferences): void {
    try {
      const updatedPreferences = { ...preferences, updatedAt: new Date().toISOString() };
      localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error('Error saving user preferences to localStorage:', error);
      throw error;
    }
  }

  // Complete App Settings Management
  static getAppSettings(): AppSettings {
    try {
      const settingsRaw = localStorage.getItem(APP_SETTINGS_KEY);
      if (settingsRaw) {
        const settings = JSON.parse(settingsRaw);
        return {
          ifrs: { ...DEFAULT_IFRS_SETTINGS, ...settings.ifrs },
          company: { ...DEFAULT_COMPANY_SETTINGS, ...settings.company },
          user: { ...DEFAULT_USER_PREFERENCES, ...settings.user },
          version: settings.version || '1.0.0',
          lastSync: settings.lastSync
        };
      }
    } catch (error) {
      console.error('Error loading app settings from localStorage:', error);
    }
    
    // Return default settings if nothing found
    return {
      ifrs: DEFAULT_IFRS_SETTINGS,
      company: DEFAULT_COMPANY_SETTINGS,
      user: DEFAULT_USER_PREFERENCES,
      version: '1.0.0'
    };
  }

  static saveAppSettings(settings: AppSettings): void {
    try {
      const updatedSettings = {
        ...settings,
        lastSync: new Date().toISOString()
      };
      localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(updatedSettings));
      
      // Also save individual settings for backward compatibility
      this.saveIFRSSettings(settings.ifrs);
      this.saveCompanySettings(settings.company);
      this.saveUserPreferences(settings.user);
    } catch (error) {
      console.error('Error saving app settings to localStorage:', error);
      throw error;
    }
  }

  // Utility Methods
  static isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  static getStorageInfo() {
    if (!this.isLocalStorageAvailable()) {
      return { available: false };
    }

    try {
      const ifrsSettings = this.getIFRSSettings();
      const companySettings = this.getCompanySettings();
      const userPreferences = this.getUserPreferences();
      const exchangeRates = this.getExchangeRates();

      return {
        available: true,
        hasIFRSSettings: !!ifrsSettings,
        hasCompanySettings: !!companySettings,
        hasUserPreferences: !!userPreferences,
        exchangeRatesCount: Object.keys(exchangeRates).length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      return { available: true, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static clearAllSettings(): void {
    try {
      localStorage.removeItem(IFRS_SETTINGS_KEY);
      localStorage.removeItem(COMPANY_SETTINGS_KEY);
      localStorage.removeItem(USER_PREFERENCES_KEY);
      localStorage.removeItem(APP_SETTINGS_KEY);
      localStorage.removeItem(FIAT_RATES_STORAGE_KEY);
      localStorage.removeItem(CRYPTO_RATES_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing settings from localStorage:', error);
      throw error;
    }
  }

  // Export/Import functionality
  static exportSettings() {
    try {
      return {
        appSettings: this.getAppSettings(),
        exchangeRates: this.getExchangeRates(),
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  static importSettings(data: SettingsImportData): void {
    try {
      if (data.appSettings) {
        this.saveAppSettings(data.appSettings);
      }
      if (data.exchangeRates) {
        // Convert exchangeRates object to array format if needed
        const ratesArray = Object.entries(data.exchangeRates).map(([code, rate]) => ({ 
          code, 
          rate: rate as number,
          name: '',
          type: 'fiat' as const,
          lastUpdated: new Date().toISOString()
        }));
        this.saveFiatRates(ratesArray);
      }
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }
}

// Interface for import data structure
interface SettingsImportData {
  appSettings?: AppSettings;
  exchangeRates?: Record<string, number>;
  exportedAt?: string;
}
