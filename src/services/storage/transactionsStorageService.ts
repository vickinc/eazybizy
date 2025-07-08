import { Transaction, BankAccount, DigitalWallet, BookkeepingEntry } from '@/types';

export class TransactionsStorageService {
  private static readonly TRANSACTIONS_KEY = 'app-transactions';
  private static readonly BANK_ACCOUNTS_KEY = 'app-bank-accounts';
  private static readonly DIGITAL_WALLETS_KEY = 'app-digital-wallets';
  private static readonly BOOKKEEPING_ENTRIES_KEY = 'app-bookkeeping-entries';

  // Transactions
  static getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(this.TRANSACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  }

  static saveTransactions(transactions: Transaction[]): void {
    try {
      localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
      throw new Error('Failed to save transactions');
    }
  }

  static addTransaction(transaction: Transaction): void {
    const transactions = this.getTransactions();
    transactions.unshift(transaction); // Add to beginning for chronological order
    this.saveTransactions(transactions);
  }

  static updateTransaction(updatedTransaction: Transaction): void {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === updatedTransaction.id);
    if (index !== -1) {
      transactions[index] = updatedTransaction;
      this.saveTransactions(transactions);
    }
  }

  static deleteTransaction(transactionId: string): void {
    const transactions = this.getTransactions();
    const filtered = transactions.filter(t => t.id !== transactionId);
    this.saveTransactions(filtered);
  }

  static deleteMultipleTransactions(transactionIds: string[]): void {
    const transactions = this.getTransactions();
    const filtered = transactions.filter(t => !transactionIds.includes(t.id));
    this.saveTransactions(filtered);
  }

  // Bank Accounts
  static getBankAccounts(): BankAccount[] {
    try {
      const data = localStorage.getItem(this.BANK_ACCOUNTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      return [];
    }
  }

  // Digital Wallets
  static getDigitalWallets(): DigitalWallet[] {
    try {
      const data = localStorage.getItem(this.DIGITAL_WALLETS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading digital wallets:', error);
      return [];
    }
  }

  // Bookkeeping Entries
  static getBookkeepingEntries(): BookkeepingEntry[] {
    try {
      const data = localStorage.getItem(this.BOOKKEEPING_ENTRIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading bookkeeping entries:', error);
      return [];
    }
  }

  // Bulk operations
  static addMultipleTransactions(transactions: Transaction[]): void {
    const existingTransactions = this.getTransactions();
    const updatedTransactions = [...transactions, ...existingTransactions];
    this.saveTransactions(updatedTransactions);
  }

  // Data validation
  static validateTransactionData(transaction: unknown): transaction is Transaction {
    return (
      typeof transaction === 'object' &&
      transaction !== null &&
      typeof transaction.id === 'string' &&
      typeof transaction.companyId === 'number' &&
      typeof transaction.date === 'string' &&
      typeof transaction.paidBy === 'string' &&
      typeof transaction.paidTo === 'string' &&
      typeof transaction.netAmount === 'number' &&
      typeof transaction.currency === 'string' &&
      typeof transaction.baseCurrency === 'string' &&
      typeof transaction.baseCurrencyAmount === 'number' &&
      typeof transaction.accountId === 'string' &&
      (transaction.accountType === 'bank' || transaction.accountType === 'wallet') &&
      typeof transaction.createdAt === 'string' &&
      typeof transaction.updatedAt === 'string'
    );
  }

  // Data migration and cleanup
  static migrateData(): void {
    // Future: Add data migration logic if schema changes
    console.log('Data migration check completed');
  }

  static clearAllData(): void {
    try {
      localStorage.removeItem(this.TRANSACTIONS_KEY);
      console.log('All transaction data cleared');
    } catch (error) {
      console.error('Error clearing transaction data:', error);
    }
  }

  // Export/Import functionality
  static exportData(): string {
    const data = {
      transactions: this.getTransactions(),
      bankAccounts: this.getBankAccounts(),
      digitalWallets: this.getDigitalWallets(),
      entries: this.getBookkeepingEntries(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.transactions && Array.isArray(data.transactions)) {
        this.saveTransactions(data.transactions);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}