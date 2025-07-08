import { Transaction, BankAccount, DigitalWallet } from '@/types';
import { ManualCashflowEntry } from '@/services/business/cashflowBusinessService';

export class CashflowStorageService {
  // Manual cashflow entries
  static getManualCashflowEntries(): ManualCashflowEntry[] {
    try {
      const saved = localStorage.getItem('app-manual-cashflow');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading manual cashflow entries:', error);
      return [];
    }
  }

  static saveManualCashflowEntries(entries: ManualCashflowEntry[]): void {
    try {
      localStorage.setItem('app-manual-cashflow', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving manual cashflow entries:', error);
    }
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
  static async loadAllCashflowData(): Promise<{
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
        Promise.resolve(this.getManualCashflowEntries())
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