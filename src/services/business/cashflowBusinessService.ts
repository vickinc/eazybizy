import { 
  Transaction, 
  BankAccount, 
  DigitalWallet, 
  Company 
} from '@/types';

export interface ManualCashflowEntry {
  id: string;
  companyId: number;
  accountId: string;
  accountType: 'bank' | 'wallet';
  type: 'inflow' | 'outflow';
  amount: number;
  currency: string;
  period: string; // Format: YYYY-MM
  description: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewManualEntry {
  companyId: number;
  accountId: string;
  accountType: 'bank' | 'wallet';
  type: 'inflow' | 'outflow';
  amount: string;
  currency: string;
  period: string;
  description: string;
  notes: string;
}

export interface AccountInfo {
  id: string;
  type: 'bank' | 'wallet';
  name: string;
  companyId: number;
  currency: string;
}

export interface EnhancedAccountInfo extends AccountInfo {
  company: Company;
  cashflow: CashflowData;
  formattedCashflow: {
    automatic: {
      inflow: string;
      outflow: string;
      net: string;
    };
    manual: {
      inflow: string;
      outflow: string;
      net: string;
    };
    total: {
      inflow: string;
      outflow: string;
      net: string;
    };
  };
}

export interface CashflowData {
  automatic: {
    inflow: number;
    outflow: number;
    net: number;
  };
  manual: {
    inflow: number;
    outflow: number;
    net: number;
  };
  total: {
    inflow: number;
    outflow: number;
    net: number;
  };
}

export interface CashflowSummary {
  totalAccounts: number;
  total: {
    inflow: number;
    outflow: number;
    net: number;
  };
  automatic: {
    inflow: number;
    outflow: number;
    net: number;
  };
  manual: {
    inflow: number;
    outflow: number;
    net: number;
  };
}

export interface GroupedCashflow {
  key: string;
  name: string;
  accounts: AccountInfo[];
}

export interface EnhancedGroupedCashflow {
  key: string;
  name: string;
  accounts: EnhancedAccountInfo[];
}

export interface EnhancedBankAccount extends BankAccount {
  company: Company;
}

export interface EnhancedDigitalWallet extends DigitalWallet {
  company: Company;
}

export class CashflowBusinessService {
  // Currency formatting with crypto support
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    // List of valid ISO currency codes that Intl.NumberFormat supports
    const validCurrencies = new Set([
      'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'MXN',
      'NZD', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'INR', 'RUB', 'BRL', 'ZAR',
      'DKK', 'PLN', 'TWD', 'THB', 'MYR'
    ]);

    // Cryptocurrencies and digital tokens that need special formatting
    const cryptoCurrencies = new Set([
      'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'DOGE',
      'AVAX', 'SHIB', 'LTC', 'MATIC', 'UNI', 'LINK', 'BCH', 'XLM', 'ALGO', 'VET'
    ]);

    // Handle cryptocurrencies with appropriate decimal places
    if (cryptoCurrencies.has(currency)) {
      // Some cryptos need more decimal places, others need fewer
      let decimals = 2;
      if (['BTC', 'ETH', 'LTC', 'BCH'].includes(currency)) {
        decimals = 6; // Bitcoin and major cryptos often shown with more precision
      } else if (['SHIB', 'DOGE'].includes(currency)) {
        decimals = 8; // Meme coins often need even more precision
      } else if (['USDT', 'USDC'].includes(currency)) {
        decimals = 2; // Stablecoins typically shown like fiat
      }

      const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: decimals,
      }).format(amount);
      return `${currency} ${formattedAmount}`;
    }

    // If currency is not valid ISO code, fall back to custom formatting
    if (!validCurrencies.has(currency)) {
      const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      return `${currency} ${formattedAmount}`;
    }

    // Use standard currency formatting for valid ISO currencies
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback in case of any other formatting errors
      const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      return `${currency} ${formattedAmount}`;
    }
  }

  // Get filtered transactions based on company, period, and account type
  static getFilteredTransactions(
    transactions: Transaction[],
    selectedCompany: number | 'all',
    selectedPeriod: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom',
    customDateRange: { start: string; end: string },
    filterBy: 'all' | 'banks' | 'wallets'
  ): Transaction[] {
    let filtered = transactions;

    // Filter by company
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(transaction => transaction.companyId === selectedCompany);
    }

    // Filter by period
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const endOfThisYear = new Date(now.getFullYear(), 11, 31);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

    switch (selectedPeriod) {
      case 'thisMonth':
        filtered = filtered.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startOfThisMonth && transactionDate <= endOfThisMonth;
        });
        break;
      case 'lastMonth':
        filtered = filtered.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth;
        });
        break;
      case 'thisYear':
        filtered = filtered.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startOfThisYear && transactionDate <= endOfThisYear;
        });
        break;
      case 'lastYear':
        filtered = filtered.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startOfLastYear && transactionDate <= endOfLastYear;
        });
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          const startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          filtered = filtered.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= startDate && transactionDate <= endDate;
          });
        }
        break;
      case 'allTime':
      default:
        break;
    }

    // Filter by account type
    if (filterBy === 'banks') {
      filtered = filtered.filter(transaction => transaction.accountType === 'bank');
    } else if (filterBy === 'wallets') {
      filtered = filtered.filter(transaction => transaction.accountType === 'wallet');
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Get filtered manual entries based on company, period, and account type
  static getFilteredManualEntries(
    manualEntries: ManualCashflowEntry[],
    selectedCompany: number | 'all',
    selectedPeriod: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom',
    customDateRange: { start: string; end: string },
    filterBy: 'all' | 'banks' | 'wallets'
  ): ManualCashflowEntry[] {
    let filtered = manualEntries;

    // Filter by company
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(entry => entry.companyId === selectedCompany);
    }

    // Filter by account type
    if (filterBy === 'banks') {
      filtered = filtered.filter(entry => entry.accountType === 'bank');
    } else if (filterBy === 'wallets') {
      filtered = filtered.filter(entry => entry.accountType === 'wallet');
    }

    // Filter by period (based on the period field)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    switch (selectedPeriod) {
      case 'thisMonth':
        const thisMonthPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        filtered = filtered.filter(entry => entry.period === thisMonthPeriod);
        break;
      case 'lastMonth':
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const lastMonthPeriod = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`;
        filtered = filtered.filter(entry => entry.period === lastMonthPeriod);
        break;
      case 'thisYear':
        filtered = filtered.filter(entry => entry.period.startsWith(String(currentYear)));
        break;
      case 'lastYear':
        filtered = filtered.filter(entry => entry.period.startsWith(String(currentYear - 1)));
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          const startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          filtered = filtered.filter(entry => {
            const entryDate = new Date(entry.period + '-01');
            return entryDate >= startDate && entryDate <= endDate;
          });
        }
        break;
      case 'allTime':
      default:
        break;
    }

    return filtered.sort((a, b) => b.period.localeCompare(a.period));
  }

  // Get all accounts (banks + wallets) for selected company
  static getAllAccounts(
    bankAccounts: BankAccount[],
    digitalWallets: DigitalWallet[],
    selectedCompany: number | 'all'
  ): AccountInfo[] {
    const accounts: AccountInfo[] = [];
    
    bankAccounts.forEach(acc => {
      if (selectedCompany === 'all' || acc.companyId === selectedCompany) {
        accounts.push({
          id: acc.id,
          type: 'bank',
          name: `${acc.bankName} - ${acc.accountName}`,
          companyId: acc.companyId,
          currency: acc.currency
        });
      }
    });
    
    digitalWallets.forEach(wallet => {
      if (selectedCompany === 'all' || wallet.companyId === selectedCompany) {
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
            accounts.push({
              id: `${wallet.id}-${currency}`,
              type: 'wallet',
              name: `${wallet.walletName} (${currency})`,
              companyId: wallet.companyId,
              currency: currency
            });
          });
        } else {
          // Fall back to single currency wallet
          accounts.push({
            id: wallet.id,
            type: 'wallet',
            name: wallet.walletName,
            companyId: wallet.companyId,
            currency: wallet.currency
          });
        }
      }
    });
    
    return accounts;
  }

  // Group cashflow data by specified criteria
  static getGroupedCashflow(
    accounts: AccountInfo[],
    groupBy: 'none' | 'month' | 'account' | 'currency',
    groupedView: boolean
  ): GroupedCashflow[] {
    if (groupBy === 'none' || !groupedView) {
      return [{ key: 'All Cashflow', name: 'All Cashflow', accounts }];
    }

    const grouped: { [key: string]: AccountInfo[] } = {};

    accounts.forEach(account => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'account':
          groupKey = account.name;
          break;
        case 'currency':
          groupKey = account.currency;
          break;
        case 'month':
          // For month grouping, we'll show all accounts but group by current period
          const now = new Date();
          groupKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          groupKey = 'All Cashflow';
      }

      if (groupKey) {
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(account);
      }
    });

    return Object.entries(grouped)
      .map(([key, accounts]) => ({ key, name: key, accounts }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Calculate cashflow for a specific account
  static calculateAccountCashflow(
    accountId: string,
    accountType: 'bank' | 'wallet',
    filteredTransactions: Transaction[],
    filteredManualEntries: ManualCashflowEntry[]
  ): CashflowData {
    // For multi-currency wallets, extract the original wallet ID
    const originalAccountId = accountType === 'wallet' && accountId.includes('-') 
      ? accountId.split('-')[0] 
      : accountId;
    
    // Calculate automatic cashflow from transactions
    // For multi-currency wallets, match both original ID and currency-specific ID
    const accountTransactions = filteredTransactions.filter(t => {
      if (t.accountType !== accountType) return false;
      
      if (accountType === 'wallet' && accountId.includes('-')) {
        // For multi-currency wallet entries, match original wallet ID
        return t.accountId === originalAccountId;
      }
      
      // For regular accounts (banks or single-currency wallets), exact match
      return t.accountId === accountId;
    });
    
    const automaticInflow = accountTransactions.reduce((sum, t) => sum + (t.incomingAmount || 0), 0);
    const automaticOutflow = accountTransactions.reduce((sum, t) => sum + (t.outgoingAmount || 0), 0);
    
    // Calculate manual cashflow from manual entries
    // For multi-currency wallets, match both original ID and currency-specific ID
    const accountManualEntries = filteredManualEntries.filter(e => {
      if (e.accountType !== accountType) return false;
      
      if (accountType === 'wallet' && accountId.includes('-')) {
        // For multi-currency wallet entries, match original wallet ID or currency-specific ID
        return e.accountId === originalAccountId || e.accountId === accountId;
      }
      
      // For regular accounts (banks or single-currency wallets), exact match
      return e.accountId === accountId;
    });
    
    const manualInflow = accountManualEntries
      .filter(e => e.type === 'inflow')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const manualOutflow = accountManualEntries
      .filter(e => e.type === 'outflow')
      .reduce((sum, e) => sum + e.amount, 0);
    
    return {
      automatic: {
        inflow: automaticInflow,
        outflow: automaticOutflow,
        net: automaticInflow - automaticOutflow
      },
      manual: {
        inflow: manualInflow,
        outflow: manualOutflow,
        net: manualInflow - manualOutflow
      },
      total: {
        inflow: automaticInflow + manualInflow,
        outflow: automaticOutflow + manualOutflow,
        net: (automaticInflow + manualInflow) - (automaticOutflow + manualOutflow)
      }
    };
  }

  // Calculate overall summary for all accounts
  static calculateSummary(
    accounts: AccountInfo[],
    filteredTransactions: Transaction[],
    filteredManualEntries: ManualCashflowEntry[],
    viewFilter: 'all' | 'automatic' | 'manual' = 'all'
  ): CashflowSummary {
    let totalInflow = 0;
    let totalOutflow = 0;
    let totalAutoInflow = 0;
    let totalAutoOutflow = 0;
    let totalManualInflow = 0;
    let totalManualOutflow = 0;
    
    accounts.forEach(account => {
      const cashflow = this.calculateAccountCashflow(
        account.id, 
        account.type, 
        filteredTransactions, 
        filteredManualEntries
      );
      
      // Only include relevant data based on viewFilter
      if (viewFilter === 'all' || viewFilter === 'automatic') {
        totalAutoInflow += cashflow.automatic.inflow;
        totalAutoOutflow += cashflow.automatic.outflow;
      }
      
      if (viewFilter === 'all' || viewFilter === 'manual') {
        totalManualInflow += cashflow.manual.inflow;
        totalManualOutflow += cashflow.manual.outflow;
      }
      
      // Total is calculated based on what's included
      totalInflow = totalAutoInflow + totalManualInflow;
      totalOutflow = totalAutoOutflow + totalManualOutflow;
    });
    
    return {
      totalAccounts: accounts.length,
      total: {
        inflow: totalInflow,
        outflow: totalOutflow,
        net: totalInflow - totalOutflow
      },
      automatic: {
        inflow: totalAutoInflow,
        outflow: totalAutoOutflow,
        net: totalAutoInflow - totalAutoOutflow
      },
      manual: {
        inflow: totalManualInflow,
        outflow: totalManualOutflow,
        net: totalManualInflow - totalManualOutflow
      }
    };
  }

  // Validate manual entry data
  static validateManualEntry(entry: NewManualEntry): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!entry.companyId) {
      errors.push('Company is required');
    }

    if (!entry.accountId) {
      errors.push('Account is required');
    }

    if (!entry.amount.trim()) {
      errors.push('Amount is required');
    } else {
      const amount = parseFloat(entry.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('Amount must be a valid positive number');
      }
    }

    if (!entry.description.trim()) {
      errors.push('Description is required');
    }

    if (!entry.period) {
      errors.push('Period is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Create manual cashflow entry from form data
  static createManualEntry(entryData: NewManualEntry): ManualCashflowEntry {
    return {
      id: `manual_${Date.now()}`,
      companyId: entryData.companyId,
      accountId: entryData.accountId,
      accountType: entryData.accountType,
      type: entryData.type,
      amount: parseFloat(entryData.amount),
      currency: entryData.currency,
      period: entryData.period,
      description: entryData.description,
      notes: entryData.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Get account by ID and type
  static getAccountById(
    accountId: string,
    accountType: 'bank' | 'wallet',
    bankAccounts: BankAccount[],
    digitalWallets: DigitalWallet[]
  ): BankAccount | DigitalWallet | undefined {
    if (accountType === 'bank') {
      return bankAccounts.find(acc => acc.id === accountId);
    }
    
    // For wallets, handle both original ID and multi-currency ID format
    const originalWalletId = accountId.includes('-') ? accountId.split('-')[0] : accountId;
    return digitalWallets.find(acc => acc.id === originalWalletId);
  }

  // Generate initial new manual entry
  static getInitialNewManualEntry(): NewManualEntry {
    return {
      companyId: 0,
      accountId: '',
      accountType: 'bank',
      type: 'inflow',
      amount: '',
      currency: 'USD',
      period: new Date().toISOString().substring(0, 7), // YYYY-MM
      description: '',
      notes: ''
    };
  }

  // Create enhanced account info with pre-computed cashflow and company data
  static createEnhancedAccountInfo(
    account: AccountInfo,
    companies: Company[],
    filteredTransactions: Transaction[],
    filteredManualEntries: ManualCashflowEntry[],
    viewFilter: 'all' | 'automatic' | 'manual' = 'all'
  ): EnhancedAccountInfo | null {
    const company = companies.find(c => c.id === account.companyId);
    if (!company) {
      console.warn(`Company not found for account ${account.id} with companyId ${account.companyId}. Skipping account.`);
      return null;
    }

    const cashflow = this.calculateAccountCashflow(
      account.id,
      account.type,
      filteredTransactions,
      filteredManualEntries
    );

    // Create modified cashflow based on viewFilter for display purposes
    const displayCashflow = {
      automatic: cashflow.automatic,
      manual: cashflow.manual,
      total: {
        inflow: 0,
        outflow: 0,
        net: 0
      }
    };

    // Calculate display totals based on viewFilter
    switch (viewFilter) {
      case 'automatic':
        displayCashflow.total = { ...cashflow.automatic };
        break;
      case 'manual':
        displayCashflow.total = { ...cashflow.manual };
        break;
      case 'all':
      default:
        displayCashflow.total = { ...cashflow.total };
        break;
    }

    return {
      ...account,
      company,
      cashflow: displayCashflow,
      formattedCashflow: {
        automatic: {
          inflow: this.formatCurrency(displayCashflow.automatic.inflow, account.currency),
          outflow: this.formatCurrency(displayCashflow.automatic.outflow, account.currency),
          net: this.formatCurrency(displayCashflow.automatic.net, account.currency),
        },
        manual: {
          inflow: this.formatCurrency(displayCashflow.manual.inflow, account.currency),
          outflow: this.formatCurrency(displayCashflow.manual.outflow, account.currency),
          net: this.formatCurrency(displayCashflow.manual.net, account.currency),
        },
        total: {
          inflow: this.formatCurrency(displayCashflow.total.inflow, account.currency),
          outflow: this.formatCurrency(displayCashflow.total.outflow, account.currency),
          net: this.formatCurrency(displayCashflow.total.net, account.currency),
        },
      },
    };
  }

  // Create enhanced grouped cashflow with pre-computed data
  static getEnhancedGroupedCashflow(
    accounts: AccountInfo[],
    companies: Company[],
    filteredTransactions: Transaction[],
    filteredManualEntries: ManualCashflowEntry[],
    groupBy: 'none' | 'month' | 'account' | 'currency',
    groupedView: boolean,
    viewFilter: 'all' | 'automatic' | 'manual' = 'all'
  ): EnhancedGroupedCashflow[] {
    // First create enhanced accounts, filtering out nulls (orphaned accounts)
    const enhancedAccounts = accounts
      .map(account => 
        this.createEnhancedAccountInfo(account, companies, filteredTransactions, filteredManualEntries, viewFilter)
      )
      .filter((account): account is EnhancedAccountInfo => account !== null);

    if (groupBy === 'none' || !groupedView) {
      return [{ key: 'All Cashflow', name: 'All Cashflow', accounts: enhancedAccounts }];
    }

    const grouped: { [key: string]: EnhancedAccountInfo[] } = {};

    enhancedAccounts.forEach(account => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'account':
          groupKey = account.name;
          break;
        case 'currency':
          groupKey = account.currency;
          break;
        case 'month':
          // For month grouping, we'll show all accounts but group by current period
          const now = new Date();
          groupKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          groupKey = 'All Cashflow';
      }

      if (groupKey) {
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(account);
      }
    });

    return Object.entries(grouped)
      .map(([key, accounts]) => ({ key, name: key, accounts }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Create enhanced bank accounts with company info
  static createEnhancedBankAccounts(
    bankAccounts: BankAccount[],
    companies: Company[],
    selectedCompany: number | 'all'
  ): EnhancedBankAccount[] {
    return bankAccounts
      .filter(acc => selectedCompany === 'all' || acc.companyId === selectedCompany)
      .map(acc => {
        const company = companies.find(c => c.id === acc.companyId);
        if (!company) {
          console.warn(`Company not found for bank account ${acc.id} with companyId ${acc.companyId}. Skipping account.`);
          return null;
        }
        return { ...acc, company };
      })
      .filter((acc): acc is EnhancedBankAccount => acc !== null);
  }

  // Create enhanced digital wallets with company info
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
          console.warn(`Company not found for digital wallet ${wallet.id} with companyId ${wallet.companyId}. Skipping wallet.`);
          return null;
        }
        return { ...wallet, company };
      })
      .filter((wallet): wallet is EnhancedDigitalWallet => wallet !== null);
  }
}