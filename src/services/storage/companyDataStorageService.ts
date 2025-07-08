import { BankAccount, DigitalWallet } from '@/types';

const BANK_ACCOUNTS_STORAGE_KEY = 'app-bank-accounts';
const DIGITAL_WALLETS_STORAGE_KEY = 'app-digital-wallets';

export class CompanyDataStorageService {
  static getBankAccounts(): BankAccount[] {
    try {
      const savedBankAccounts = localStorage.getItem(BANK_ACCOUNTS_STORAGE_KEY);
      if (savedBankAccounts) {
        // TODO: Consider if migration is needed for bank accounts
        return JSON.parse(savedBankAccounts) as BankAccount[];
      }
    } catch (error) {
      console.error('Error loading bank accounts from localStorage:', error);
    }
    return [];
  }

  static saveBankAccounts(bankAccounts: BankAccount[]): boolean {
    try {
      localStorage.setItem(BANK_ACCOUNTS_STORAGE_KEY, JSON.stringify(bankAccounts));
      return true;
    } catch (error) {
      console.error('Error saving bank accounts to localStorage:', error);
      return false;
    }
  }

  static getDigitalWallets(): DigitalWallet[] {
    try {
      const savedDigitalWallets = localStorage.getItem(DIGITAL_WALLETS_STORAGE_KEY);
      if (savedDigitalWallets) {
        // TODO: Consider if migration is needed for digital wallets
        return JSON.parse(savedDigitalWallets) as DigitalWallet[];
      }
    } catch (error) {
      console.error('Error loading digital wallets from localStorage:', error);
    }
    return [];
  }

  static saveDigitalWallets(digitalWallets: DigitalWallet[]): boolean {
    try {
      localStorage.setItem(DIGITAL_WALLETS_STORAGE_KEY, JSON.stringify(digitalWallets));
      return true;
    } catch (error) {
      console.error('Error saving digital wallets to localStorage:', error);
      return false;
    }
  }
}
