import { CurrencyRate } from '@/types';
import { CurrencyRatesBusinessService } from '../business/currencyRatesBusinessService';

const FIAT_RATES_STORAGE_KEY = 'app-fiat-rates';
const CRYPTO_RATES_STORAGE_KEY = 'app-crypto-rates';
const DATA_VERSION_KEY = 'app-currency-rates-version';
const CURRENT_DATA_VERSION = '1.0.0';

export interface CurrencyRatesData {
  fiatRates: CurrencyRate[];
  cryptoRates: CurrencyRate[];
}

export class CurrencyRatesStorageService {
  static async loadAllCurrencyRatesData(): Promise<CurrencyRatesData> {
    try {
      await this.migrateDataIfNeeded();
      
      const fiatRates = this.loadFiatRates();
      const cryptoRates = this.loadCryptoRates();

      return {
        fiatRates,
        cryptoRates
      };
    } catch (error) {
      console.error('Error loading currency rates data:', error);
      return {
        fiatRates: CurrencyRatesBusinessService.getDefaultFiatCurrencies(),
        cryptoRates: CurrencyRatesBusinessService.getDefaultCryptoCurrencies()
      };
    }
  }

  static loadFiatRates(): CurrencyRate[] {
    try {
      const savedRates = localStorage.getItem(FIAT_RATES_STORAGE_KEY);
      if (savedRates) {
        const parsed = JSON.parse(savedRates);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all rates are valid numbers
          return parsed.map(rate => ({
            ...rate,
            rate: typeof rate.rate === 'number' ? rate.rate : parseFloat(rate.rate) || 0
          }));
        }
      }
    } catch (error) {
      console.error('Error loading fiat rates:', error);
    }
    
    const defaultRates = CurrencyRatesBusinessService.getDefaultFiatCurrencies();
    this.saveFiatRates(defaultRates);
    return defaultRates;
  }

  static loadCryptoRates(): CurrencyRate[] {
    try {
      const savedRates = localStorage.getItem(CRYPTO_RATES_STORAGE_KEY);
      if (savedRates) {
        const parsed = JSON.parse(savedRates);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all rates are valid numbers
          return parsed.map(rate => ({
            ...rate,
            rate: typeof rate.rate === 'number' ? rate.rate : parseFloat(rate.rate) || 0
          }));
        }
      }
    } catch (error) {
      console.error('Error loading crypto rates:', error);
    }
    
    const defaultRates = CurrencyRatesBusinessService.getDefaultCryptoCurrencies();
    this.saveCryptoRates(defaultRates);
    return defaultRates;
  }

  static saveFiatRates(rates: CurrencyRate[]): void {
    try {
      localStorage.setItem(FIAT_RATES_STORAGE_KEY, JSON.stringify(rates));
      this.setDataVersion();
      
      window.dispatchEvent(new CustomEvent('currencyRatesUpdated'));
    } catch (error) {
      console.error('Error saving fiat rates:', error);
      throw new Error('Failed to save fiat currency rates');
    }
  }

  static saveCryptoRates(rates: CurrencyRate[]): void {
    try {
      localStorage.setItem(CRYPTO_RATES_STORAGE_KEY, JSON.stringify(rates));
      this.setDataVersion();
      
      window.dispatchEvent(new CustomEvent('currencyRatesUpdated'));
    } catch (error) {
      console.error('Error saving crypto rates:', error);
      throw new Error('Failed to save crypto currency rates');
    }
  }

  static saveAllRates(fiatRates: CurrencyRate[], cryptoRates: CurrencyRate[]): void {
    try {
      this.saveFiatRates(fiatRates);
      this.saveCryptoRates(cryptoRates);
    } catch (error) {
      console.error('Error saving all currency rates:', error);
      throw new Error('Failed to save currency rates');
    }
  }

  static resetFiatRatesToDefaults(): CurrencyRate[] {
    const defaultRates = CurrencyRatesBusinessService.getDefaultFiatCurrencies();
    this.saveFiatRates(defaultRates);
    return defaultRates;
  }

  static resetCryptoRatesToDefaults(): CurrencyRate[] {
    const defaultRates = CurrencyRatesBusinessService.getDefaultCryptoCurrencies();
    this.saveCryptoRates(defaultRates);
    return defaultRates;
  }

  static clearAllData(): void {
    try {
      localStorage.removeItem(FIAT_RATES_STORAGE_KEY);
      localStorage.removeItem(CRYPTO_RATES_STORAGE_KEY);
      localStorage.removeItem(DATA_VERSION_KEY);
    } catch (error) {
      console.error('Error clearing currency rates data:', error);
    }
  }

  static exportData(): string {
    try {
      const fiatRates = this.loadFiatRates();
      const cryptoRates = this.loadCryptoRates();
      
      const exportData = {
        version: CURRENT_DATA_VERSION,
        exportDate: new Date().toISOString(),
        fiatRates,
        cryptoRates
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting currency rates data:', error);
      throw new Error('Failed to export currency rates data');
    }
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.fiatRates || !data.cryptoRates) {
        throw new Error('Invalid data format');
      }
      
      if (!Array.isArray(data.fiatRates) || !Array.isArray(data.cryptoRates)) {
        throw new Error('Invalid data structure');
      }
      
      this.saveFiatRates(data.fiatRates);
      this.saveCryptoRates(data.cryptoRates);
      
      return true;
    } catch (error) {
      console.error('Error importing currency rates data:', error);
      return false;
    }
  }

  private static setDataVersion(): void {
    try {
      localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
    } catch (error) {
      console.error('Error setting data version:', error);
    }
  }

  private static getDataVersion(): string | null {
    try {
      return localStorage.getItem(DATA_VERSION_KEY);
    } catch (error) {
      console.error('Error getting data version:', error);
      return null;
    }
  }

  private static async migrateDataIfNeeded(): Promise<void> {
    const currentVersion = this.getDataVersion();
    
    if (!currentVersion || currentVersion !== CURRENT_DATA_VERSION) {
      
      try {
        const fiatRates = this.loadFiatRates();
        const cryptoRates = this.loadCryptoRates();
        
        this.saveFiatRates(fiatRates);
        this.saveCryptoRates(cryptoRates);
        
      } catch (error) {
        console.error('Error during currency rates data migration:', error);
      }
    }
  }

  static getStorageInfo(): { 
    fiatCount: number; 
    cryptoCount: number; 
    lastUpdated: string;
    dataVersion: string;
  } {
    try {
      const fiatRates = this.loadFiatRates();
      const cryptoRates = this.loadCryptoRates();
      const version = this.getDataVersion() || 'Unknown';
      
      const allRates = [...fiatRates, ...cryptoRates];
      const lastUpdated = allRates.length > 0 
        ? new Date(Math.max(...allRates.map(r => new Date(r.lastUpdated).getTime()))).toISOString()
        : new Date().toISOString();
      
      return {
        fiatCount: fiatRates.length,
        cryptoCount: cryptoRates.length,
        lastUpdated,
        dataVersion: version
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        fiatCount: 0,
        cryptoCount: 0,
        lastUpdated: new Date().toISOString(),
        dataVersion: 'Unknown'
      };
    }
  }
}