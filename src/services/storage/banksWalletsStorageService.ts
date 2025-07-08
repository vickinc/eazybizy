import { BankAccount, DigitalWallet } from '@/types';

export interface BanksWalletsStorageData {
  bankAccounts: BankAccount[];
  digitalWallets: DigitalWallet[];
}

export class BanksWalletsStorageService {
  private static readonly BANK_ACCOUNTS_KEY = 'app-bank-accounts';
  private static readonly DIGITAL_WALLETS_KEY = 'app-digital-wallets';

  // Load all banks and wallets data
  static async loadAllBanksWalletsData(): Promise<BanksWalletsStorageData> {
    try {
      const bankAccounts = this.loadBankAccounts();
      const digitalWallets = this.loadDigitalWallets();

      return {
        bankAccounts,
        digitalWallets
      };
    } catch (error) {
      console.error('Error loading banks and wallets data:', error);
      throw error;
    }
  }

  // Load bank accounts from localStorage
  static loadBankAccounts(): BankAccount[] {
    try {
      const savedData = localStorage.getItem(this.BANK_ACCOUNTS_KEY);
      if (!savedData) {
        console.log('No bank accounts data found in localStorage');
        return [];
      }

      const parsedData = JSON.parse(savedData);
      console.log('Loaded bank accounts from localStorage:', parsedData);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      console.error('Error loading bank accounts from localStorage:', error);
      return [];
    }
  }

  // Load digital wallets from localStorage
  static loadDigitalWallets(): DigitalWallet[] {
    try {
      const savedData = localStorage.getItem(this.DIGITAL_WALLETS_KEY);
      if (!savedData) {
        console.log('No digital wallets data found in localStorage');
        return [];
      }

      const parsedData = JSON.parse(savedData);
      console.log('Loaded digital wallets from localStorage:', parsedData);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      console.error('Error loading digital wallets from localStorage:', error);
      return [];
    }
  }

  // Save bank accounts to localStorage
  static saveBankAccounts(bankAccounts: BankAccount[]): void {
    try {
      const dataToSave = JSON.stringify(bankAccounts);
      localStorage.setItem(this.BANK_ACCOUNTS_KEY, dataToSave);
      console.log('Bank accounts saved to localStorage:', bankAccounts);
    } catch (error) {
      console.error('Error saving bank accounts to localStorage:', error);
      throw error;
    }
  }

  // Save digital wallets to localStorage
  static saveDigitalWallets(digitalWallets: DigitalWallet[]): void {
    try {
      const dataToSave = JSON.stringify(digitalWallets);
      localStorage.setItem(this.DIGITAL_WALLETS_KEY, dataToSave);
      console.log('Digital wallets saved to localStorage:', digitalWallets);
    } catch (error) {
      console.error('Error saving digital wallets to localStorage:', error);
      throw error;
    }
  }

  // Save all data
  static saveAllBanksWalletsData(data: BanksWalletsStorageData): void {
    try {
      this.saveBankAccounts(data.bankAccounts);
      this.saveDigitalWallets(data.digitalWallets);
      console.log('All banks and wallets data saved successfully');
    } catch (error) {
      console.error('Error saving banks and wallets data:', error);
      throw error;
    }
  }

  // Clear all banks and wallets data
  static clearAllBanksWalletsData(): void {
    try {
      localStorage.removeItem(this.BANK_ACCOUNTS_KEY);
      localStorage.removeItem(this.DIGITAL_WALLETS_KEY);
      console.log('All banks and wallets data cleared from localStorage');
    } catch (error) {
      console.error('Error clearing banks and wallets data:', error);
      throw error;
    }
  }

  // Check if data exists in localStorage
  static hasBankAccountsData(): boolean {
    return localStorage.getItem(this.BANK_ACCOUNTS_KEY) !== null;
  }

  static hasDigitalWalletsData(): boolean {
    return localStorage.getItem(this.DIGITAL_WALLETS_KEY) !== null;
  }

  static hasAnyData(): boolean {
    return this.hasBankAccountsData() || this.hasDigitalWalletsData();
  }

  // Get data size information
  static getDataSize(): { bankAccounts: number; digitalWallets: number; total: number } {
    const bankAccountsData = localStorage.getItem(this.BANK_ACCOUNTS_KEY) || '';
    const digitalWalletsData = localStorage.getItem(this.DIGITAL_WALLETS_KEY) || '';
    
    const bankAccountsSize = new Blob([bankAccountsData]).size;
    const digitalWalletsSize = new Blob([digitalWalletsData]).size;
    
    return {
      bankAccounts: bankAccountsSize,
      digitalWallets: digitalWalletsSize,
      total: bankAccountsSize + digitalWalletsSize
    };
  }

  // Data cleanup function to remove orphaned accounts/wallets
  static cleanupOrphanedData(validCompanyIds: number[]): {
    removedBankAccounts: number;
    removedDigitalWallets: number;
    report: string[];
  } {
    try {
      const companyIdsSet = new Set(validCompanyIds);
      const report: string[] = [];
      
      // Clean bank accounts
      const bankAccounts = this.loadBankAccounts();
      const validBankAccounts = bankAccounts.filter(account => {
        const isValid = companyIdsSet.has(account.companyId);
        if (!isValid) {
          report.push(`Removed orphaned bank account ${account.id} (company ${account.companyId})`);
        }
        return isValid;
      });
      
      // Clean digital wallets
      const digitalWallets = this.loadDigitalWallets();
      const validDigitalWallets = digitalWallets.filter(wallet => {
        const isValid = companyIdsSet.has(wallet.companyId);
        if (!isValid) {
          report.push(`Removed orphaned digital wallet ${wallet.id} (company ${wallet.companyId})`);
        }
        return isValid;
      });
      
      // Save cleaned data
      this.saveBankAccounts(validBankAccounts);
      this.saveDigitalWallets(validDigitalWallets);
      
      const removedBankAccounts = bankAccounts.length - validBankAccounts.length;
      const removedDigitalWallets = digitalWallets.length - validDigitalWallets.length;
      
      report.unshift(`Cleanup completed: removed ${removedBankAccounts} bank accounts and ${removedDigitalWallets} digital wallets`);
      
      console.log('Data cleanup completed:', {
        removedBankAccounts,
        removedDigitalWallets,
        report
      });
      
      return {
        removedBankAccounts,
        removedDigitalWallets,
        report
      };
    } catch (error) {
      console.error('Error during data cleanup:', error);
      throw error;
    }
  }

  // Migration helper (if needed for future schema changes)
  static migrateData(): void {
    try {
      // Check if migration is needed based on data structure
      // Perform any necessary data migrations here
      // For example, adding new fields or changing data structure
      
      console.log('Data migration completed successfully');
    } catch (error) {
      console.error('Error during data migration:', error);
      throw error;
    }
  }

  // Backup and restore functionality
  static exportData(): string {
    try {
      const data = {
        bankAccounts: this.loadBankAccounts(),
        digitalWallets: this.loadDigitalWallets(),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting banks and wallets data:', error);
      throw error;
    }
  }

  static importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate data structure
      if (!data.bankAccounts || !Array.isArray(data.bankAccounts)) {
        throw new Error('Invalid bank accounts data in import');
      }
      
      if (!data.digitalWallets || !Array.isArray(data.digitalWallets)) {
        throw new Error('Invalid digital wallets data in import');
      }
      
      // Save imported data
      this.saveBankAccounts(data.bankAccounts);
      this.saveDigitalWallets(data.digitalWallets);
      
      console.log('Banks and wallets data imported successfully');
    } catch (error) {
      console.error('Error importing banks and wallets data:', error);
      throw error;
    }
  }

  // Alias methods for balance service compatibility
  static getAllBankAccounts(): BankAccount[] {
    return this.loadBankAccounts();
  }

  static getAllDigitalWallets(): DigitalWallet[] {
    return this.loadDigitalWallets();
  }
}

// Export an instance for compatibility with other services
export const banksWalletsStorageService = new class {
  getAllBankAccounts(): BankAccount[] {
    return BanksWalletsStorageService.getAllBankAccounts();
  }

  getAllDigitalWallets(): DigitalWallet[] {
    return BanksWalletsStorageService.getAllDigitalWallets();
  }
};