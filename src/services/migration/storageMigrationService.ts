/**
 * Storage Migration Service
 * Handles migration from old portalpro-* keys to new app-* keys
 */

export class StorageMigrationService {
  private static readonly MIGRATION_VERSION_KEY = 'app-migration-version';
  private static readonly CURRENT_VERSION = '1.0.0';

  private static readonly KEY_MAPPINGS: Record<string, string> = {
    // Bookkeeping
    'portalpro-bookkeeping-entries': 'app-bookkeeping-entries',
    'portalpro-bookkeeping-accounts': 'app-bookkeeping-accounts',
    
    // Financial
    'portalpro-invoices': 'app-invoices',
    'portalpro-transactions': 'app-transactions',
    'portalpro-manual-cashflow': 'app-manual-cashflow',
    
    // Entities
    'portalpro-clients': 'app-clients',
    'portalpro-vendors': 'app-vendors',
    'portalpro-products': 'app-products',
    'portalpro-product-groups': 'app-product-groups',
    'portalpro-companies': 'app-companies',
    'portalpro-business-cards': 'app-business-cards',
    
    // Banking
    'portalpro-bank-accounts': 'app-bank-accounts',
    'portalpro-digital-wallets': 'app-digital-wallets',
    
    // Calendar & Notes
    'portalpro-events': 'app-events',
    'portalpro-notes': 'app-notes',
    
    // Settings
    'portalpro-fiat-rates': 'app-fiat-rates',
    'portalpro-crypto-rates': 'app-crypto-rates',
    'portalpro-currency-rates-version': 'app-currency-rates-version',
  };

  /**
   * Run the migration if needed
   */
  static async runMigration(): Promise<void> {
    try {
      const lastMigrationVersion = localStorage.getItem(this.MIGRATION_VERSION_KEY);
      
      if (lastMigrationVersion === this.CURRENT_VERSION) {
        console.log('Storage migration already completed');
        return;
      }

      console.log('Starting storage migration...');
      let migratedCount = 0;

      // Migrate each key
      for (const [oldKey, newKey] of Object.entries(this.KEY_MAPPINGS)) {
        const data = localStorage.getItem(oldKey);
        
        if (data !== null) {
          // Check if new key already exists
          const existingData = localStorage.getItem(newKey);
          
          if (existingData === null) {
            // Migrate the data
            localStorage.setItem(newKey, data);
            console.log(`Migrated ${oldKey} → ${newKey}`);
            migratedCount++;
          } else {
            console.warn(`Skipping ${oldKey} - ${newKey} already exists`);
          }
        }
      }

      // Mark migration as complete
      localStorage.setItem(this.MIGRATION_VERSION_KEY, this.CURRENT_VERSION);
      console.log(`Storage migration completed. Migrated ${migratedCount} items.`);
      
      // Clean up old keys after successful migration
      if (migratedCount > 0) {
        console.log('Cleaning up old keys...');
        this.cleanupOldKeys();
      }

    } catch (error) {
      console.error('Storage migration failed:', error);
      // Don't throw - allow app to continue even if migration fails
    }
  }

  /**
   * Clean up old keys (call this after confirming migration success)
   */
  static cleanupOldKeys(): void {
    try {
      let removedCount = 0;
      
      for (const oldKey of Object.keys(this.KEY_MAPPINGS)) {
        if (localStorage.getItem(oldKey) !== null) {
          localStorage.removeItem(oldKey);
          removedCount++;
        }
      }

      console.log(`Cleanup completed. Removed ${removedCount} old keys.`);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  /**
   * Check if migration is needed
   */
  static isMigrationNeeded(): boolean {
    const lastMigrationVersion = localStorage.getItem(this.MIGRATION_VERSION_KEY);
    return lastMigrationVersion !== this.CURRENT_VERSION;
  }

  /**
   * Force cleanup of old keys even if migration was already completed
   */
  static forceCleanupOldKeys(): void {
    try {
      let removedCount = 0;
      
      // First, clean up keys in the mapping
      for (const oldKey of Object.keys(this.KEY_MAPPINGS)) {
        if (localStorage.getItem(oldKey) !== null) {
          localStorage.removeItem(oldKey);
          console.log(`Removed mapped old key: ${oldKey}`);
          removedCount++;
        }
      }
      
      // Then, clean up ANY remaining portalpro- keys (in case there are unmapped ones)
      const allKeys = Object.keys(localStorage);
      const remainingOldKeys = allKeys.filter(key => key.startsWith('portalpro-'));
      
      for (const oldKey of remainingOldKeys) {
        localStorage.removeItem(oldKey);
        console.log(`Removed unmapped old key: ${oldKey}`);
        removedCount++;
      }

      console.log(`Force cleanup completed. Removed ${removedCount} old keys total.`);
      
      // Trigger a storage event to notify other parts of the app
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'migration-cleanup',
        newValue: Date.now().toString(),
        storageArea: localStorage,
      }));
      
    } catch (error) {
      console.error('Force cleanup failed:', error);
    }
  }

  /**
   * Get migration status report
   */
  static getMigrationStatus(): {
    migrated: boolean;
    oldKeysPresent: string[];
    newKeysPresent: string[];
  } {
    const oldKeysPresent: string[] = [];
    const newKeysPresent: string[] = [];

    for (const [oldKey, newKey] of Object.entries(this.KEY_MAPPINGS)) {
      if (localStorage.getItem(oldKey) !== null) {
        oldKeysPresent.push(oldKey);
      }
      if (localStorage.getItem(newKey) !== null) {
        newKeysPresent.push(newKey);
      }
    }

    return {
      migrated: localStorage.getItem(this.MIGRATION_VERSION_KEY) === this.CURRENT_VERSION,
      oldKeysPresent,
      newKeysPresent,
    };
  }
}