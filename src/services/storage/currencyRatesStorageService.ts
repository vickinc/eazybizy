import { CurrencyRate } from '@/types';
import { CurrencyRatesBusinessService } from '../business/currencyRatesBusinessService';
import { CurrencyRatesApiService } from '../api/currencyRatesApiService';

const FIAT_RATES_STORAGE_KEY = 'app-fiat-rates';
const CRYPTO_RATES_STORAGE_KEY = 'app-crypto-rates';
const DATA_VERSION_KEY = 'app-currency-rates-version';
const MIGRATION_FLAG_KEY = 'app-currency-rates-migrated';
const CURRENT_DATA_VERSION = '2.0.0'; // Updated version for database storage

export interface CurrencyRatesData {
  fiatRates: CurrencyRate[];
  cryptoRates: CurrencyRate[];
}

export class CurrencyRatesStorageService {
  static async loadAllCurrencyRatesData(): Promise<CurrencyRatesData> {
    try {
      console.log('🚀 Starting currency rates data loading...');
      await this.migrateDataIfNeeded();
      
      // Try to load from database first
      console.log('📡 Loading fiat and crypto rates in parallel...');
      const [fiatRates, cryptoRates] = await Promise.all([
        this.loadFiatRates(),
        this.loadCryptoRates()
      ]);

      console.log(`🎯 Final result: ${fiatRates.length} fiat rates, ${cryptoRates.length} crypto rates`);
      
      return {
        fiatRates,
        cryptoRates
      };
    } catch (error) {
      console.error('❌ Error loading currency rates data:', error);
      
      // Fallback to defaults and ensure they're in database
      console.log('🏗️ Loading fallback defaults...');
      const fiatDefaults = CurrencyRatesBusinessService.getDefaultFiatCurrencies();
      const cryptoDefaults = CurrencyRatesBusinessService.getDefaultCryptoCurrencies();
      
      // Try to initialize defaults in database
      try {
        await CurrencyRatesApiService.initializeDefaults([...fiatDefaults, ...cryptoDefaults]);
        console.log(`💾 Initialized ${fiatDefaults.length + cryptoDefaults.length} default rates in database`);
      } catch (dbError) {
        console.error('❌ Error initializing default rates in database:', dbError);
      }
      
      return {
        fiatRates: fiatDefaults,
        cryptoRates: cryptoDefaults
      };
    }
  }

  static async loadFiatRates(): Promise<CurrencyRate[]> {
    try {
      console.log('🔄 Loading fiat rates from database...');
      // Try database first
      const dbRates = await CurrencyRatesApiService.findByType('fiat');
      console.log(`✅ Loaded ${dbRates.length} fiat rates from database`);
      if (dbRates.length > 0) {
        return dbRates;
      }
      
      console.log('⚠️ No fiat rates in database, checking localStorage...');
      // Fallback to localStorage for migration
      const savedRates = this.loadFiatRatesFromLocalStorage();
      if (savedRates.length > 0) {
        console.log(`🔄 Migrating ${savedRates.length} fiat rates from localStorage to database...`);
        // Migrate to database
        await this.migrateFiatRatesToDatabase(savedRates);
        return savedRates;
      }
    } catch (error) {
      console.error('❌ Error loading fiat rates from database:', error);
      
      // Try localStorage fallback
      try {
        const localRates = this.loadFiatRatesFromLocalStorage();
        console.log(`📦 Loaded ${localRates.length} fiat rates from localStorage fallback`);
        return localRates;
      } catch (localStorageError) {
        console.error('❌ Error loading fiat rates from localStorage:', localStorageError);
      }
    }
    
    // Final fallback to defaults
    console.log('🏗️ Loading default fiat rates...');
    const defaultRates = CurrencyRatesBusinessService.getDefaultFiatCurrencies();
    try {
      await this.saveFiatRates(defaultRates);
      console.log(`💾 Saved ${defaultRates.length} default fiat rates to database`);
    } catch (error) {
      console.error('❌ Error saving default fiat rates:', error);
    }
    return defaultRates;
  }

  static async loadCryptoRates(): Promise<CurrencyRate[]> {
    try {
      console.log('🔄 Loading crypto rates from database...');
      // Try database first
      const dbRates = await CurrencyRatesApiService.findByType('crypto');
      console.log(`✅ Loaded ${dbRates.length} crypto rates from database`);
      if (dbRates.length > 0) {
        return dbRates;
      }
      
      console.log('⚠️ No crypto rates in database, checking localStorage...');
      // Fallback to localStorage for migration
      const savedRates = this.loadCryptoRatesFromLocalStorage();
      if (savedRates.length > 0) {
        console.log(`🔄 Migrating ${savedRates.length} crypto rates from localStorage to database...`);
        // Migrate to database
        await this.migrateCryptoRatesToDatabase(savedRates);
        return savedRates;
      }
    } catch (error) {
      console.error('❌ Error loading crypto rates from database:', error);
      
      // Try localStorage fallback
      try {
        const localRates = this.loadCryptoRatesFromLocalStorage();
        console.log(`📦 Loaded ${localRates.length} crypto rates from localStorage fallback`);
        return localRates;
      } catch (localStorageError) {
        console.error('❌ Error loading crypto rates from localStorage:', localStorageError);
      }
    }
    
    // Final fallback to defaults
    console.log('🏗️ Loading default crypto rates...');
    const defaultRates = CurrencyRatesBusinessService.getDefaultCryptoCurrencies();
    try {
      await this.saveCryptoRates(defaultRates);
      console.log(`💾 Saved ${defaultRates.length} default crypto rates to database`);
    } catch (error) {
      console.error('❌ Error saving default crypto rates:', error);
    }
    return defaultRates;
  }

  static async saveFiatRates(rates: CurrencyRate[]): Promise<void> {
    try {
      console.log(`💾 Saving ${rates.length} fiat rates to database...`);
      // Save to database via API
      const fiatRates = rates.filter(rate => rate.type === 'fiat');
      console.log(`🔄 Filtered to ${fiatRates.length} fiat rates for API call`);
      
      await CurrencyRatesApiService.saveRates(fiatRates);
      console.log(`✅ Successfully saved ${fiatRates.length} fiat rates to database`);
      
      // Also save to localStorage as backup
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(FIAT_RATES_STORAGE_KEY, JSON.stringify(rates));
        this.setDataVersion();
        console.log(`📦 Backed up ${rates.length} fiat rates to localStorage`);
      }
      
      // Dispatch event for immediate UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('currencyRatesUpdated'));
        console.log(`📡 Dispatched currencyRatesUpdated event`);
      }
    } catch (error) {
      console.error('❌ Error saving fiat rates to database:', error);
      
      // Fallback to localStorage only
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(FIAT_RATES_STORAGE_KEY, JSON.stringify(rates));
          this.setDataVersion();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('currencyRatesUpdated'));
          }
          console.log(`📦 Fell back to localStorage-only save for ${rates.length} fiat rates`);
        }
      } catch (localStorageError) {
        console.error('❌ Even localStorage fallback failed:', localStorageError);
        throw new Error('Failed to save fiat currency rates');
      }
    }
  }

  static async saveCryptoRates(rates: CurrencyRate[]): Promise<void> {
    try {
      // Save to database via API
      const cryptoRates = rates.filter(rate => rate.type === 'crypto');
      await CurrencyRatesApiService.saveRates(cryptoRates);
      
      // Also save to localStorage as backup
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CRYPTO_RATES_STORAGE_KEY, JSON.stringify(rates));
        this.setDataVersion();
      }
      
      // Dispatch event for immediate UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('currencyRatesUpdated'));
      }
    } catch (error) {
      console.error('Error saving crypto rates:', error);
      
      // Fallback to localStorage only
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(CRYPTO_RATES_STORAGE_KEY, JSON.stringify(rates));
          this.setDataVersion();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('currencyRatesUpdated'));
          }
        }
      } catch (localStorageError) {
        throw new Error('Failed to save crypto currency rates');
      }
    }
  }

  static async saveAllRates(fiatRates: CurrencyRate[], cryptoRates: CurrencyRate[]): Promise<void> {
    try {
      // Save all rates in a single API call
      const allRates = [...fiatRates, ...cryptoRates];
      await CurrencyRatesApiService.saveRates(allRates);
      
      // Also save to localStorage as backup
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(FIAT_RATES_STORAGE_KEY, JSON.stringify(fiatRates));
        localStorage.setItem(CRYPTO_RATES_STORAGE_KEY, JSON.stringify(cryptoRates));
        this.setDataVersion();
      }
      
      // Dispatch event for immediate UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('currencyRatesUpdated'));
      }
    } catch (error) {
      console.error('Error saving all currency rates:', error);
      throw new Error('Failed to save currency rates');
    }
  }

  static async resetFiatRatesToDefaults(): Promise<CurrencyRate[]> {
    const defaultRates = CurrencyRatesBusinessService.getDefaultFiatCurrencies();
    await this.saveFiatRates(defaultRates);
    return defaultRates;
  }

  static async resetCryptoRatesToDefaults(): Promise<CurrencyRate[]> {
    const defaultRates = CurrencyRatesBusinessService.getDefaultCryptoCurrencies();
    await this.saveCryptoRates(defaultRates);
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
    const migrationFlag = this.getMigrationFlag();
    
    console.log(`🔧 Migration check: version=${currentVersion}, migrated=${migrationFlag}`);
    
    // Check if we need to migrate from localStorage to database
    // Only migrate if we haven't migrated before
    if (!migrationFlag) {
      try {
        console.log('🔄 Starting currency rates migration to database...');
        
        // First, check if there's already data in the database
        const existingFiatRates = await CurrencyRatesApiService.findByType('fiat');
        const existingCryptoRates = await CurrencyRatesApiService.findByType('crypto');
        
        console.log(`🗄️ Found ${existingFiatRates.length} fiat and ${existingCryptoRates.length} crypto rates in database`);
        
        if (existingFiatRates.length > 0 || existingCryptoRates.length > 0) {
          console.log('✅ Database already has data, skipping migration');
        } else {
          // Database is empty, check localStorage for migration
          const fiatRates = this.loadFiatRatesFromLocalStorage();
          const cryptoRates = this.loadCryptoRatesFromLocalStorage();
          
          console.log(`📦 Found ${fiatRates.length} fiat and ${cryptoRates.length} crypto rates in localStorage`);
          
          if (fiatRates.length > 0 || cryptoRates.length > 0) {
            // Migrate from localStorage to database
            await CurrencyRatesApiService.migrateFromLocalStorage(fiatRates, cryptoRates);
            console.log(`✅ Successfully migrated ${fiatRates.length + cryptoRates.length} currency rates to database`);
          } else {
            // No existing data anywhere, initialize defaults
            console.log('🏗️ No data found anywhere, initializing defaults...');
            const defaultFiat = CurrencyRatesBusinessService.getDefaultFiatCurrencies();
            const defaultCrypto = CurrencyRatesBusinessService.getDefaultCryptoCurrencies();
            await CurrencyRatesApiService.initializeDefaults([...defaultFiat, ...defaultCrypto]);
            console.log(`💾 Initialized ${defaultFiat.length + defaultCrypto.length} default currency rates in database`);
          }
        }
        
        // Mark migration as complete
        this.setMigrationFlag();
        this.setDataVersion();
        console.log('🎯 Migration completed and marked as done');
        
      } catch (error) {
        console.error('❌ Error during currency rates migration:', error);
        // Don't throw - let the app continue with fallback behavior
      }
    } else {
      console.log('✅ No migration needed - data already migrated');
    }
  }

  static async getStorageInfo(): Promise<{ 
    fiatCount: number; 
    cryptoCount: number; 
    lastUpdated: string;
    dataVersion: string;
  }> {
    try {
      // Get stats from database via API
      const stats = await CurrencyRatesApiService.getStats();
      const version = this.getDataVersion() || 'Unknown';
      
      return {
        fiatCount: stats.fiatRates,
        cryptoCount: stats.cryptoRates,
        lastUpdated: stats.lastUpdated || new Date().toISOString(),
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

  // Helper methods for localStorage fallback and migration
  private static loadFiatRatesFromLocalStorage(): CurrencyRate[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      
      const savedRates = localStorage.getItem(FIAT_RATES_STORAGE_KEY);
      if (savedRates) {
        const parsed = JSON.parse(savedRates);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(rate => ({
            ...rate,
            rate: typeof rate.rate === 'number' ? rate.rate : parseFloat(rate.rate) || 0
          }));
        }
      }
    } catch (error) {
      console.error('Error loading fiat rates from localStorage:', error);
    }
    return [];
  }

  private static loadCryptoRatesFromLocalStorage(): CurrencyRate[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      
      const savedRates = localStorage.getItem(CRYPTO_RATES_STORAGE_KEY);
      if (savedRates) {
        const parsed = JSON.parse(savedRates);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(rate => ({
            ...rate,
            rate: typeof rate.rate === 'number' ? rate.rate : parseFloat(rate.rate) || 0
          }));
        }
      }
    } catch (error) {
      console.error('Error loading crypto rates from localStorage:', error);
    }
    return [];
  }

  private static async migrateFiatRatesToDatabase(rates: CurrencyRate[]): Promise<void> {
    try {
      const migratedRates = rates.map(rate => ({ ...rate, source: 'migration' }));
      await CurrencyRatesApiService.saveRates(migratedRates);
      console.log(`Migrated ${rates.length} fiat rates to database`);
    } catch (error) {
      console.error('Error migrating fiat rates to database:', error);
      throw error;
    }
  }

  private static async migrateCryptoRatesToDatabase(rates: CurrencyRate[]): Promise<void> {
    try {
      const migratedRates = rates.map(rate => ({ ...rate, source: 'migration' }));
      await CurrencyRatesApiService.saveRates(migratedRates);
      console.log(`Migrated ${rates.length} crypto rates to database`);
    } catch (error) {
      console.error('Error migrating crypto rates to database:', error);
      throw error;
    }
  }

  private static getMigrationFlag(): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
    } catch (error) {
      console.error('Error getting migration flag:', error);
      return false;
    }
  }

  private static setMigrationFlag(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      }
    } catch (error) {
      console.error('Error setting migration flag:', error);
    }
  }
}