import { 
  BankAccount, 
  DigitalWallet, 
  Company 
} from '@/types';
import { BanksWalletsStorageService } from '@/services/storage/banksWalletsStorageService';

export interface NewBankAccount {
  companyId: number;
  bankName: string;
  bankAddress: string;
  currency: string;
  iban: string;
  swiftCode: string;
  accountNumber: string;
  accountName: string;
  notes: string;
}

export interface NewDigitalWallet {
  companyId: number;
  walletType: 'paypal' | 'stripe' | 'wise' | 'crypto' | 'other';
  walletName: string;
  walletAddress: string;
  currency: string;
  currencies: string[];
  description: string;
  blockchain: string;
  notes: string;
}

export interface EnhancedBankAccount extends BankAccount {
  company: Company;
}

export interface EnhancedDigitalWallet extends DigitalWallet {
  company: Company;
}

export interface BanksWalletsSummary {
  totalBankAccounts: number;
  activeBankAccounts: number;
  totalDigitalWallets: number;
  activeDigitalWallets: number;
  totalAccounts: number;
  activeAccounts: number;
}

export interface BanksWalletsData {
  bankAccounts: BankAccount[];
  digitalWallets: DigitalWallet[];
  enhancedBankAccounts: EnhancedBankAccount[];
  enhancedDigitalWallets: EnhancedDigitalWallet[];
  filteredBankAccounts: EnhancedBankAccount[];
  filteredDigitalWallets: EnhancedDigitalWallet[];
  summary: BanksWalletsSummary;
}

export class BanksWalletsBusinessService {
  // Currency lists
  static readonly CURRENCIES = [
    'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'MXN',
    'NZD', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'INR', 'RUB', 'BRL', 'ZAR',
    'DKK', 'PLN', 'TWD', 'THB', 'MYR'
  ];

  static readonly CRYPTO_CURRENCIES = [
    'USDT', 'USDC', 'EURC', 'PYSD', 'USDG', 'USDS', 'SOL', 'BTC', 'ETH', 
    'SUI', 'HYPE', 'TRX', 'BNB', 'XRP', 'DOGE', 'ADA'
  ];

  static readonly WALLET_TYPES = [
    { value: 'paypal', label: 'PayPal' },
    { value: 'stripe', label: 'Stripe' },
    { value: 'wise', label: 'Wise (TransferWise)' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'other', label: 'Other' }
  ];

  // Initial data creators
  static getInitialNewBankAccount(): NewBankAccount {
    return {
      companyId: 0,
      bankName: '',
      bankAddress: '',
      currency: 'USD',
      iban: '',
      swiftCode: '',
      accountNumber: '',
      accountName: '',
      notes: ''
    };
  }

  static getInitialNewDigitalWallet(): NewDigitalWallet {
    return {
      companyId: 0,
      walletType: 'paypal',
      walletName: '',
      walletAddress: '',
      currency: 'USD',
      currencies: [],
      description: '',
      blockchain: '',
      notes: ''
    };
  }

  // Validation methods
  static validateBankAccount(bankAccount: NewBankAccount): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!bankAccount.companyId) {
      errors.push('Company is required');
    }

    if (!bankAccount.bankName.trim()) {
      errors.push('Bank name is required');
    }

    if (!bankAccount.accountName.trim()) {
      errors.push('Account name is required');
    }

    if (!bankAccount.swiftCode.trim()) {
      errors.push('SWIFT code is required');
    }

    // Require either IBAN or Account Number (but not both)
    if (!bankAccount.iban.trim() && !bankAccount.accountNumber.trim()) {
      errors.push('Either IBAN or Account Number is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateDigitalWallet(wallet: NewDigitalWallet): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!wallet.companyId) {
      errors.push('Company is required');
    }

    if (!wallet.walletName.trim()) {
      errors.push('Wallet name is required');
    }

    if (!wallet.walletAddress.trim()) {
      errors.push('Wallet address/email is required');
    }

    // Check if blockchain is required for crypto wallets
    if (wallet.walletType === 'crypto' && !wallet.blockchain.trim()) {
      errors.push('Blockchain field is required for cryptocurrency wallets');
    }

    // Check if at least one currency is selected for crypto wallets
    if (wallet.walletType === 'crypto' && wallet.currencies.length === 0) {
      errors.push('Please select at least one cryptocurrency for crypto wallets');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Data creation methods
  static createBankAccount(bankAccountData: NewBankAccount): BankAccount {
    return {
      id: `bank_${Date.now()}`,
      companyId: bankAccountData.companyId,
      bankName: bankAccountData.bankName,
      bankAddress: bankAccountData.bankAddress,
      currency: bankAccountData.currency,
      iban: bankAccountData.iban,
      swiftCode: bankAccountData.swiftCode,
      accountNumber: bankAccountData.accountNumber || undefined,
      accountName: bankAccountData.accountName,
      isActive: true,
      createdAt: new Date().toISOString(),
      notes: bankAccountData.notes || undefined
    };
  }

  static createDigitalWallet(walletData: NewDigitalWallet): DigitalWallet {
    return {
      id: `wallet_${Date.now()}`,
      companyId: walletData.companyId,
      walletType: walletData.walletType,
      walletName: walletData.walletName,
      walletAddress: walletData.walletAddress,
      currency: walletData.currency,
      currencies: walletData.walletType === 'crypto' ? walletData.currencies : undefined,
      description: walletData.description,
      blockchain: walletData.walletType === 'crypto' ? walletData.blockchain : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      notes: walletData.notes || undefined
    };
  }

  // Enhanced data creation methods
  static createEnhancedBankAccounts(
    bankAccounts: BankAccount[],
    companies: Company[],
    selectedCompany: number | 'all'
  ): EnhancedBankAccount[] {
    return bankAccounts
      .filter(account => selectedCompany === 'all' || account.companyId === selectedCompany)
      .map(account => {
        const company = companies.find(c => c.id === account.companyId);
        if (!company) {
          console.warn(`Company not found for bank account ${account.id} (companyId: ${account.companyId}). Account will be filtered out.`);
          return null;
        }
        return { ...account, company };
      })
      .filter((account): account is EnhancedBankAccount => account !== null);
  }

  static createEnhancedDigitalWallets(
    digitalWallets: DigitalWallet[],
    companies: Company[],
    selectedCompany: number | 'all'
  ): EnhancedDigitalWallet[] {
    return digitalWallets
      .filter(wallet => selectedCompany === 'all' || wallet.companyId === selectedCompany)
      .map(wallet => {
        const company = companies.find(c => c.id === wallet.companyId);
        if (!company) {
          console.warn(`Company not found for digital wallet ${wallet.id} (companyId: ${wallet.companyId}). Wallet will be filtered out.`);
          return null;
        }
        return { ...wallet, company };
      })
      .filter((wallet): wallet is EnhancedDigitalWallet => wallet !== null);
  }

  // Data validation and cleanup methods
  static validateAndCleanupData(
    bankAccounts: BankAccount[],
    digitalWallets: DigitalWallet[],
    companies: Company[]
  ): {
    validBankAccounts: BankAccount[];
    validDigitalWallets: DigitalWallet[];
    orphanedBankAccounts: BankAccount[];
    orphanedDigitalWallets: DigitalWallet[];
    report: string[];
  } {
    const companyIds = new Set(companies.map(c => c.id));
    const report: string[] = [];
    
    // Check bank accounts
    const validBankAccounts: BankAccount[] = [];
    const orphanedBankAccounts: BankAccount[] = [];
    
    bankAccounts.forEach(account => {
      if (companyIds.has(account.companyId)) {
        validBankAccounts.push(account);
      } else {
        orphanedBankAccounts.push(account);
        report.push(`Bank account ${account.id} references non-existent company ${account.companyId}`);
      }
    });
    
    // Check digital wallets
    const validDigitalWallets: DigitalWallet[] = [];
    const orphanedDigitalWallets: DigitalWallet[] = [];
    
    digitalWallets.forEach(wallet => {
      if (companyIds.has(wallet.companyId)) {
        validDigitalWallets.push(wallet);
      } else {
        orphanedDigitalWallets.push(wallet);
        report.push(`Digital wallet ${wallet.id} references non-existent company ${wallet.companyId}`);
      }
    });
    
    // Summary
    if (orphanedBankAccounts.length > 0 || orphanedDigitalWallets.length > 0) {
      report.unshift(
        `Found ${orphanedBankAccounts.length} orphaned bank accounts and ${orphanedDigitalWallets.length} orphaned digital wallets`
      );
    } else {
      report.push('All bank accounts and digital wallets have valid company references');
    }
    
    return {
      validBankAccounts,
      validDigitalWallets,
      orphanedBankAccounts,
      orphanedDigitalWallets,
      report
    };
  }

  // Filtering methods
  static getFilteredBankAccounts(
    enhancedBankAccounts: EnhancedBankAccount[],
    searchTerm: string
  ): EnhancedBankAccount[] {
    if (!searchTerm.trim()) {
      return enhancedBankAccounts;
    }

    const searchLower = searchTerm.toLowerCase();
    return enhancedBankAccounts.filter(account =>
      account.bankName.toLowerCase().includes(searchLower) ||
      account.accountName.toLowerCase().includes(searchLower) ||
      account.company.tradingName.toLowerCase().includes(searchLower) ||
      (account.iban && account.iban.toLowerCase().includes(searchLower)) ||
      (account.accountNumber && account.accountNumber.toLowerCase().includes(searchLower)) ||
      account.currency.toLowerCase().includes(searchLower)
    );
  }

  static getFilteredDigitalWallets(
    enhancedDigitalWallets: EnhancedDigitalWallet[],
    searchTerm: string
  ): EnhancedDigitalWallet[] {
    if (!searchTerm.trim()) {
      return enhancedDigitalWallets;
    }

    const searchLower = searchTerm.toLowerCase();
    return enhancedDigitalWallets.filter(wallet =>
      wallet.walletName.toLowerCase().includes(searchLower) ||
      wallet.walletAddress.toLowerCase().includes(searchLower) ||
      wallet.company.tradingName.toLowerCase().includes(searchLower) ||
      wallet.walletType.toLowerCase().includes(searchLower) ||
      wallet.currency.toLowerCase().includes(searchLower) ||
      (wallet.description && wallet.description.toLowerCase().includes(searchLower)) ||
      (wallet.currencies && wallet.currencies.some(c => c.toLowerCase().includes(searchLower)))
    );
  }

  // Summary calculations
  static calculateSummary(
    bankAccounts: BankAccount[],
    digitalWallets: DigitalWallet[]
  ): BanksWalletsSummary {
    const activeBankAccounts = bankAccounts.filter(account => account.isActive).length;
    const activeDigitalWallets = digitalWallets.filter(wallet => wallet.isActive).length;

    return {
      totalBankAccounts: bankAccounts.length,
      activeBankAccounts,
      totalDigitalWallets: digitalWallets.length,
      activeDigitalWallets,
      totalAccounts: bankAccounts.length + digitalWallets.length,
      activeAccounts: activeBankAccounts + activeDigitalWallets
    };
  }

  // Utility methods
  static getCompanyName(companyId: number, companies: Company[]): string {
    const company = companies.find(c => c.id === companyId);
    return company ? company.tradingName : 'Unknown Company';
  }

  static getCompanyById(companyId: number, companies: Company[]): Company | undefined {
    return companies.find(c => c.id === companyId);
  }

  // Status toggle methods
  static toggleBankAccountStatus(
    bankAccounts: BankAccount[],
    accountId: string
  ): BankAccount[] {
    return bankAccounts.map(account =>
      account.id === accountId ? { ...account, isActive: !account.isActive } : account
    );
  }

  static toggleDigitalWalletStatus(
    digitalWallets: DigitalWallet[],
    walletId: string
  ): DigitalWallet[] {
    return digitalWallets.map(wallet =>
      wallet.id === walletId ? { ...wallet, isActive: !wallet.isActive } : wallet
    );
  }

  // Update methods
  static updateBankAccount(
    bankAccounts: BankAccount[],
    updatedAccount: BankAccount
  ): BankAccount[] {
    return bankAccounts.map(account =>
      account.id === updatedAccount.id ? updatedAccount : account
    );
  }

  static updateDigitalWallet(
    digitalWallets: DigitalWallet[],
    updatedWallet: DigitalWallet
  ): DigitalWallet[] {
    return digitalWallets.map(wallet =>
      wallet.id === updatedWallet.id ? updatedWallet : wallet
    );
  }

  // Delete methods
  static deleteBankAccount(
    bankAccounts: BankAccount[],
    accountId: string
  ): BankAccount[] {
    return bankAccounts.filter(account => account.id !== accountId);
  }

  static deleteDigitalWallet(
    digitalWallets: DigitalWallet[],
    walletId: string
  ): DigitalWallet[] {
    return digitalWallets.filter(wallet => wallet.id !== walletId);
  }

  // Get all accounts (banks + wallets) for balance calculations
  static getAllAccounts(): (BankAccount | DigitalWallet)[] {
    const bankAccounts = BanksWalletsStorageService.getAllBankAccounts();
    const digitalWallets = BanksWalletsStorageService.getAllDigitalWallets();
    
    // Add bank accounts with explicit type metadata
    const bankAccountsWithMeta = bankAccounts.map(account => ({
      ...account,
      name: account.bankName, // Use bank name for better identification
      __accountType: 'bank' as const, // Explicit type metadata for reliable detection
    }));

    // Process digital wallets, handling multi-currency support
    const walletAccountsWithMeta: any[] = [];
    
    digitalWallets.forEach(wallet => {
      // Parse currencies string into array if it exists
      let currenciesArray: string[] = [];
      if (wallet.currencies) {
        if (Array.isArray(wallet.currencies)) {
          currenciesArray = wallet.currencies;
        } else if (typeof wallet.currencies === 'string') {
          // Parse comma-separated string into array
          currenciesArray = wallet.currencies.split(',').map(c => c.trim()).filter(c => c.length > 0);
        }
      }
      
      // Check if wallet supports multiple currencies
      if (currenciesArray.length > 0) {
        // Create separate account entries for each supported currency
        currenciesArray.forEach(currency => {
          walletAccountsWithMeta.push({
            ...wallet,
            id: `${wallet.id}-${currency}`, // Unique ID for each currency
            name: `${wallet.walletName} (${currency})`, // Include currency in name
            currency: currency, // Override currency for this entry
            __accountType: 'wallet' as const,
          });
        });
      } else {
        // Fall back to single currency wallet
        walletAccountsWithMeta.push({
          ...wallet,
          name: wallet.walletName, // Unified name field for balance display
          __accountType: 'wallet' as const, // Explicit type metadata for reliable detection
        });
      }
    });
    
    const unifiedAccounts = [
      ...bankAccountsWithMeta,
      ...walletAccountsWithMeta
    ];
    
    return unifiedAccounts;
  }

  // Get enhanced account with company information for balance page
  static getEnhancedAccount(accountId: string, accountType: 'bank' | 'wallet'): (EnhancedBankAccount | EnhancedDigitalWallet) | null {
    const { companiesCache } = require('@/services/cache/companiesCache');
    const companies = companiesCache.getCompanies();
    
    if (accountType === 'bank') {
      const bankAccount = BanksWalletsStorageService.getAllBankAccounts().find((acc: BankAccount) => acc.id === accountId);
      if (bankAccount) {
        const company = companies.find(c => c.id === bankAccount.companyId);
        if (company) {
          return { ...bankAccount, company };
        }
      }
    } else {
      // For wallets, handle both original ID and multi-currency ID format
      const originalWalletId = accountId.includes('-') ? accountId.split('-')[0] : accountId;
      const wallet = BanksWalletsStorageService.getAllDigitalWallets().find((w: DigitalWallet) => w.id === originalWalletId);
      if (wallet) {
        const company = companies.find(c => c.id === wallet.companyId);
        if (company) {
          // If this is a multi-currency account ID, extract the currency and override
          if (accountId.includes('-')) {
            const currency = accountId.split('-')[1];
            return { 
              ...wallet, 
              company,
              currency: currency, // Override currency for this specific currency account
              name: `${wallet.walletName} (${currency})` // Include currency in name
            };
          }
          return { ...wallet, company };
        }
      }
    }
    
    return null;
  }

  // Complete data processing method
  static processAccountsData(
    bankAccounts: BankAccount[],
    digitalWallets: DigitalWallet[],
    companies: Company[],
    selectedCompany: number | 'all',
    searchTerm: string
  ): BanksWalletsData {
    // Create enhanced accounts with company data
    const enhancedBankAccounts = this.createEnhancedBankAccounts(
      bankAccounts,
      companies,
      selectedCompany
    );

    const enhancedDigitalWallets = this.createEnhancedDigitalWallets(
      digitalWallets,
      companies,
      selectedCompany
    );

    // Apply search filtering
    const filteredBankAccounts = this.getFilteredBankAccounts(
      enhancedBankAccounts,
      searchTerm
    );

    const filteredDigitalWallets = this.getFilteredDigitalWallets(
      enhancedDigitalWallets,
      searchTerm
    );

    // Calculate summary from enhanced (company-filtered) accounts
    const summary = this.calculateSummary(
      enhancedBankAccounts.map(enhanced => enhanced as BankAccount), 
      enhancedDigitalWallets.map(enhanced => enhanced as DigitalWallet)
    );

    return {
      bankAccounts,
      digitalWallets,
      enhancedBankAccounts,
      enhancedDigitalWallets,
      filteredBankAccounts,
      filteredDigitalWallets,
      summary
    };
  }

  // Page title and description generators
  static generatePageTitle(selectedCompany: number | 'all', companies: Company[]): string {
    if (selectedCompany === 'all') {
      return 'Banks & Wallets';
    }
    const company = companies.find(c => c.id === selectedCompany);
    return company ? `${company.tradingName} - Banks & Wallets` : 'Banks & Wallets';
  }

  static generatePageDescription(selectedCompany: number | 'all', companies: Company[]): string {
    if (selectedCompany === 'all') {
      return 'Manage bank accounts and digital wallets for your companies';
    }
    const company = companies.find(c => c.id === selectedCompany);
    return company 
      ? `Managing bank accounts and wallets for ${company.tradingName}` 
      : 'Manage bank accounts and digital wallets for your companies';
  }
}