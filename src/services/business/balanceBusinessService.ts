import { 
  AccountBalance, 
  BalanceFilterState, 
  BalanceSummary, 
  GroupedBalances, 
  FilterPeriod,
  AccountTypeFilter,
  BalanceViewFilter,
  BalanceGroupBy
} from '@/types/balance.types';
import { BankAccount, DigitalWallet } from '@/types/payment.types';
import { Transaction } from '@/types/bookkeeping.types';
import { Company } from '@/types/company.types';
import { balanceStorageService } from '@/services/storage/balanceStorageService';
import { banksWalletsStorageService } from '@/services/storage/banksWalletsStorageService';
import { TransactionsStorageService } from '@/services/storage/transactionsStorageService';
import { companiesCache } from '@/services/cache/companiesCache';
import { BanksWalletsBusinessService } from './banksWalletsBusinessService';
import { TransactionsBusinessService } from './transactionsBusinessService';

export class BalanceBusinessService {
  // Utility method to determine if an account is a bank account
  static isAccountBank(account: BankAccount | DigitalWallet): boolean {
    // First check for explicit type metadata (most reliable)
    if ('__accountType' in account) {
      return (account as any).__accountType === 'bank';
    }
    
    // Check for bank-specific fields
    if ('bankName' in account || 'iban' in account || 'swiftCode' in account) {
      return true;
    }
    
    // Check for wallet-specific fields
    if ('walletType' in account || 'walletAddress' in account) {
      return false;
    }
    
    // Fallback: check for accountNumber (though this is optional for banks)
    if ('accountNumber' in account) {
      return true;
    }
    
    // Default to false if unclear
    return false;
  }

  // Get all account balances with filtering
  static getAccountBalances(filters: BalanceFilterState, selectedCompany?: number | 'all'): AccountBalance[] {
    const allAccounts = BanksWalletsBusinessService.getAllAccounts();
    const companies = companiesCache.getCompanies();
    const initialBalances = balanceStorageService.getAllInitialBalances();
    
    // Apply company filter to accounts first
    const companyFilteredAccounts = allAccounts.filter(account => {
      if (selectedCompany === 'all' || selectedCompany === undefined) return true;
      return account.companyId === selectedCompany;
    });

    const accountBalances: AccountBalance[] = companyFilteredAccounts.map(account => {
      const company = companies.find(c => c.id === account.companyId);
      if (!company) return null;

      // Get initial balance for this account
      const initialBalance = initialBalances.find(
        ib => ib.accountId === account.id && 
             ib.accountType === (this.isAccountBank(account) ? 'bank' : 'wallet')
      );

      // Calculate transaction balance for the period
      const transactionData = this.calculateTransactionBalanceDetailed(
        account.id,
        this.isAccountBank(account) ? 'bank' : 'wallet',
        account.companyId,
        filters.selectedPeriod,
        filters.customDateRange
      );

      const initialAmount = initialBalance?.amount || 0;
      const finalBalance = initialAmount + transactionData.netAmount;

      return {
        account,
        company,
        initialBalance: initialAmount,
        transactionBalance: transactionData.netAmount,
        finalBalance,
        incomingAmount: transactionData.totalIncoming,
        outgoingAmount: transactionData.totalOutgoing,
        currency: account.currency,
        lastTransactionDate: this.getLastTransactionDate(account.id, this.isAccountBank(account) ? 'bank' : 'wallet')
      };
    }).filter(Boolean) as AccountBalance[];

    // Apply additional filters
    return this.applyFilters(accountBalances, filters);
  }

  // Calculate detailed transaction balance for specific account and period
  private static calculateTransactionBalanceDetailed(
    accountId: string,
    accountType: 'bank' | 'wallet',
    companyId: number,
    period: FilterPeriod,
    customRange: { startDate: string; endDate: string }
  ): { netAmount: number; totalIncoming: number; totalOutgoing: number } {
    const transactions = TransactionsStorageService.getTransactions();
    
    // For multi-currency wallets, extract the original wallet ID
    const originalAccountId = accountType === 'wallet' && accountId.includes('-') 
      ? accountId.split('-')[0] 
      : accountId;
    
    // Filter transactions for this account and period
    const filteredTransactions = transactions.filter(transaction => {
      // Account filter - for multi-currency wallets, match original wallet ID
      if (transaction.accountType !== accountType) {
        return false;
      }
      
      if (accountType === 'wallet' && accountId.includes('-')) {
        // For multi-currency wallet entries, match original wallet ID
        if (transaction.accountId !== originalAccountId) {
          return false;
        }
      } else {
        // For regular accounts (banks or single-currency wallets), exact match
        if (transaction.accountId !== accountId) {
          return false;
        }
      }

      // Company filter
      if (transaction.companyId !== companyId) {
        return false;
      }

      // Period filter
      if (period !== 'allTime') {
        const periodTransactions = TransactionsBusinessService.filterTransactionsByPeriod(
          [transaction], 
          period, 
          period === 'custom' ? { start: customRange.startDate, end: customRange.endDate } : undefined
        );
        if (periodTransactions.length === 0) {
          return false;
        }
      }

      return true;
    });

    // Calculate detailed amounts
    const totalIncoming = filteredTransactions.reduce((sum, transaction) => sum + (transaction.incomingAmount || 0), 0);
    const totalOutgoing = filteredTransactions.reduce((sum, transaction) => sum + (transaction.outgoingAmount || 0), 0);
    const netAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.netAmount, 0);

    return {
      netAmount,
      totalIncoming,
      totalOutgoing
    };
  }

  // Get last transaction date for an account
  private static getLastTransactionDate(accountId: string, accountType: 'bank' | 'wallet'): string | undefined {
    const transactions = TransactionsStorageService.getTransactions();
    
    // For multi-currency wallets, extract the original wallet ID
    const originalAccountId = accountType === 'wallet' && accountId.includes('-') 
      ? accountId.split('-')[0] 
      : accountId;
    
    const accountTransactions = transactions
      .filter(t => {
        if (t.accountType !== accountType) return false;
        
        if (accountType === 'wallet' && accountId.includes('-')) {
          // For multi-currency wallet entries, match original wallet ID
          return t.accountId === originalAccountId;
        } else {
          // For regular accounts (banks or single-currency wallets), exact match
          return t.accountId === accountId;
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return accountTransactions.length > 0 ? accountTransactions[0].date : undefined;
  }

  // Apply filters to account balances
  private static applyFilters(balances: AccountBalance[], filters: BalanceFilterState): AccountBalance[] {
    let filtered = [...balances];

    // Account type filter
    if (filters.accountTypeFilter !== 'all') {
      filtered = filtered.filter(balance => {
        const isBank = this.isAccountBank(balance.account);
        return filters.accountTypeFilter === 'banks' ? isBank : !isBank;
      });
    }

    // View filter (assets/liabilities/equity)
    if (filters.viewFilter !== 'all') {
      filtered = filtered.filter(balance => {
        switch (filters.viewFilter) {
          case 'assets':
            return balance.finalBalance >= 0;
          case 'liabilities':
            return balance.finalBalance < 0;
          case 'equity':
            // For now, treat equity as accounts with positive balance
            // This can be enhanced with account categorization
            return balance.finalBalance >= 0;
          default:
            return true;
        }
      });
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(balance => {
        const account = balance.account;
        const company = balance.company;
        
        return (
          account.name.toLowerCase().includes(searchLower) ||
          company.tradingName.toLowerCase().includes(searchLower) ||
          account.currency.toLowerCase().includes(searchLower) ||
          ('accountNumber' in account && account.accountNumber?.toLowerCase().includes(searchLower)) ||
          ('accountName' in account && account.accountName?.toLowerCase().includes(searchLower)) ||
          ('address' in account && account.address?.toLowerCase().includes(searchLower))
        );
      });
    }

    // Zero balances filter
    if (!filters.showZeroBalances) {
      filtered = filtered.filter(balance => Math.abs(balance.finalBalance) > 0.01);
    }

    return filtered;
  }

  // Group balances by specified criteria
  static groupBalances(balances: AccountBalance[], groupBy: BalanceGroupBy): GroupedBalances {
    if (groupBy === 'none') {
      return { 'All Accounts': balances };
    }

    const grouped: GroupedBalances = {};

    balances.forEach(balance => {
      let groupKey: string;

      switch (groupBy) {
        case 'account':
          groupKey = this.isAccountBank(balance.account) ? 'Bank Accounts' : 'Digital Wallets';
          break;
        case 'currency':
          groupKey = balance.currency;
          break;
        case 'type':
          // Enhanced grouping by account type
          if (this.isAccountBank(balance.account)) {
            groupKey = `Banks (${balance.currency})`;
          } else {
            groupKey = `Wallets (${balance.currency})`;
          }
          break;
        default:
          groupKey = 'Other';
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(balance);
    });

    // Sort groups alphabetically
    const sortedGrouped: GroupedBalances = {};
    Object.keys(grouped).sort().forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

    return sortedGrouped;
  }

  // Calculate balance summary
  static calculateBalanceSummary(balances: AccountBalance[]): BalanceSummary {
    const summary: BalanceSummary = {
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      accountCount: balances.length,
      bankAccountCount: 0,
      walletCount: 0,
      currencyBreakdown: {}
    };

    balances.forEach(balance => {
      const amount = balance.finalBalance;
      const currency = balance.currency;

      // Count account types
      if (this.isAccountBank(balance.account)) {
        summary.bankAccountCount++;
      } else {
        summary.walletCount++;
      }

      // Calculate assets/liabilities
      if (amount >= 0) {
        summary.totalAssets += amount;
      } else {
        summary.totalLiabilities += Math.abs(amount);
      }

      // Currency breakdown
      if (!summary.currencyBreakdown[currency]) {
        summary.currencyBreakdown[currency] = {
          assets: 0,
          liabilities: 0,
          netWorth: 0
        };
      }

      if (amount >= 0) {
        summary.currencyBreakdown[currency].assets += amount;
      } else {
        summary.currencyBreakdown[currency].liabilities += Math.abs(amount);
      }

      summary.currencyBreakdown[currency].netWorth += amount;
    });

    summary.netWorth = summary.totalAssets - summary.totalLiabilities;

    return summary;
  }

  // Get enhanced account with company information
  static getEnhancedAccount(accountId: string, accountType: 'bank' | 'wallet') {
    return BanksWalletsBusinessService.getEnhancedAccount(accountId, accountType);
  }

  // Validate account balance data
  static validateBalanceData(balances: AccountBalance[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    balances.forEach((balance, index) => {
      // Check for missing company
      if (!balance.company) {
        errors.push(`Balance ${index + 1}: Missing company information`);
      }

      // Check for invalid amounts
      if (isNaN(balance.finalBalance) || !isFinite(balance.finalBalance)) {
        errors.push(`Balance ${index + 1}: Invalid final balance amount`);
      }

      // Check for missing currency
      if (!balance.currency) {
        errors.push(`Balance ${index + 1}: Missing currency information`);
      }

      // Warning for very old last transaction
      if (balance.lastTransactionDate) {
        const lastDate = new Date(balance.lastTransactionDate);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        if (lastDate < sixMonthsAgo) {
          warnings.push(`Account ${balance.account.name}: Last transaction over 6 months ago`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Format currency amount
  static formatCurrency(amount: number, currency: string): string {
    return TransactionsBusinessService.formatCurrency(amount, currency);
  }

  // Export balance data
  static exportBalanceData(balances: AccountBalance[], format: 'csv' | 'json' = 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(balances, null, 2);
    }

    // CSV format
    const headers = [
      'Account Name',
      'Company',
      'Account Type',
      'Currency',
      'Initial Balance',
      'Transaction Balance',
      'Final Balance',
      'Last Transaction Date'
    ];

    const rows = balances.map(balance => [
      balance.account.name,
      balance.company.tradingName,
      this.isAccountBank(balance.account) ? 'Bank' : 'Wallet',
      balance.currency,
      balance.initialBalance.toString(),
      balance.transactionBalance.toString(),
      balance.finalBalance.toString(),
      balance.lastTransactionDate || 'Never'
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}