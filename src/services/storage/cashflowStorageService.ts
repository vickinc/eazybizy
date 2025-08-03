import { Transaction, BankAccount, DigitalWallet } from '@/types';
import { ManualCashflowEntry } from '@/services/business/cashflowBusinessService';
import { CashflowApiService } from '@/services/api/cashflowApiService';

export class CashflowStorageService {
  // Check if we should use localStorage (for migration purposes)
  private static shouldUseLocalStorage(): boolean {
    // Check if there's data in localStorage that hasn't been migrated yet
    try {
      const saved = localStorage.getItem('app-manual-cashflow');
      return saved && JSON.parse(saved).length > 0;
    } catch {
      return false;
    }
  }

  // Manual cashflow entries - now uses API with localStorage fallback for migration
  static async getManualCashflowEntries(companyId?: number | 'all'): Promise<ManualCashflowEntry[]> {
    try {
      // Check if we need to migrate from localStorage first
      if (this.shouldUseLocalStorage()) {
        const localEntries = this.getLocalStorageEntries();
        
        // Attempt migration
        if (localEntries.length > 0) {
          console.log('Migrating manual cashflow entries from localStorage to database...');
          const migrationResult = await CashflowApiService.migrateFromLocalStorage(localEntries);
          
          if (migrationResult.success > 0) {
            console.log(`Successfully migrated ${migrationResult.success} entries`);
            // Clear localStorage after successful migration
            localStorage.removeItem('app-manual-cashflow');
          }
          
          if (migrationResult.failed > 0) {
            console.error(`Failed to migrate ${migrationResult.failed} entries:`, migrationResult.errors);
          }
        }
      }

      // Fetch from API
      const filters = companyId ? { companyId } : undefined;
      const response = await CashflowApiService.getManualCashflowEntries(filters);
      
      // Transform the response to match the expected format
      return response.data.map(entry => ({
        id: entry.id,
        companyId: entry.companyId,
        accountId: entry.accountId,
        accountType: entry.accountType,
        type: entry.type,
        amount: entry.amount,
        currency: entry.currency,
        period: entry.period,
        description: entry.description,
        notes: entry.notes,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      }));
    } catch (error) {
      console.error('Error loading manual cashflow entries from API:', error);
      
      // Fallback to localStorage if API fails
      return this.getLocalStorageEntries();
    }
  }

  // Helper method to get entries from localStorage
  private static getLocalStorageEntries(): ManualCashflowEntry[] {
    try {
      const saved = localStorage.getItem('app-manual-cashflow');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading manual cashflow entries from localStorage:', error);
      return [];
    }
  }

  // Save is now a no-op since we're using the API
  static saveManualCashflowEntries(entries: ManualCashflowEntry[]): void {
    // No-op - entries are now saved via API
    console.log('Manual cashflow entries are now saved via API');
  }

  // Transactions (used for automatic cashflow calculation)
  static getTransactions(): Transaction[] {
    try {
      const saved = localStorage.getItem('app-transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  }

  // Bank accounts
  static getBankAccounts(): BankAccount[] {
    try {
      const saved = localStorage.getItem('app-bank-accounts');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      return [];
    }
  }

  // Digital wallets
  static getDigitalWallets(): DigitalWallet[] {
    try {
      const saved = localStorage.getItem('app-digital-wallets');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading digital wallets:', error);
      return [];
    }
  }

  // Load all cashflow-related data in one go
  static async loadAllCashflowData(companyId?: number | 'all'): Promise<{
    transactions: Transaction[];
    bankAccounts: BankAccount[];
    digitalWallets: DigitalWallet[];
    manualEntries: ManualCashflowEntry[];
  }> {
    try {
      const [transactions, bankAccounts, digitalWallets, manualEntries] = await Promise.all([
        Promise.resolve(this.getTransactions()),
        Promise.resolve(this.getBankAccounts()),
        Promise.resolve(this.getDigitalWallets()),
        this.getManualCashflowEntries(companyId)
      ]);

      return {
        transactions,
        bankAccounts,
        digitalWallets,
        manualEntries
      };
    } catch (error) {
      console.error('Error loading cashflow data:', error);
      throw error;
    }
  }
}