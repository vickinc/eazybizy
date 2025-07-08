import { ChartOfAccount } from '@/types';

export class ChartOfAccountsStorageService {
  private static readonly STORAGE_KEY = 'app-chart-of-accounts';

  private static isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  static getAccounts(): ChartOfAccount[] {
    if (!this.isLocalStorageAvailable()) {
      return [];
    }
    
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading chart of accounts from localStorage:', error);
      return [];
    }
  }

  static saveAccounts(accounts: ChartOfAccount[]): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(accounts));
    } catch (error) {
      console.error('Error saving chart of accounts to localStorage:', error);
    }
  }

  static addAccount(account: ChartOfAccount): void {
    const accounts = this.getAccounts();
    accounts.push(account);
    this.saveAccounts(accounts);
  }

  static updateAccount(updatedAccount: ChartOfAccount): void {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(account => account.id === updatedAccount.id);
    
    if (index !== -1) {
      accounts[index] = updatedAccount;
      this.saveAccounts(accounts);
    }
  }

  static deleteAccount(id: string): void {
    const accounts = this.getAccounts();
    const filteredAccounts = accounts.filter(account => account.id !== id);
    this.saveAccounts(filteredAccounts);
  }

  static getAccountByCode(code: string): ChartOfAccount | null {
    const accounts = this.getAccounts();
    return accounts.find(account => account.code === code) || null;
  }

  static getAccountById(id: string): ChartOfAccount | null {
    const accounts = this.getAccounts();
    return accounts.find(account => account.id === id) || null;
  }

  static isCodeUnique(code: string, excludeId?: string): boolean {
    const accounts = this.getAccounts();
    return !accounts.some(account => 
      account.code === code && account.id !== excludeId
    );
  }

  static clearAllAccounts(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing chart of accounts from localStorage:', error);
    }
  }

  static getAccountsCount(): number {
    return this.getAccounts().length;
  }

  static hasInitialData(): boolean {
    return this.getAccountsCount() > 0;
  }
}