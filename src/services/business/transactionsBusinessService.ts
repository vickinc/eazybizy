import { 
  Transaction,
  BankAccount,
  DigitalWallet,
  BookkeepingEntry,
  Company
} from '@/types';

export interface BulkTransaction {
  paidBy: string;
  paidTo: string;
  reference: string;
  amount: string;
  tax: string;
  category: string;
  description: string;
  notes: string;
  date: string;
  currency: string;
  accountId: string;
  linkedEntryId?: string;
}

export class TransactionsBusinessService {
  static generateTransactionId(): string {
    return `${Date.now()}_${Math.random()}`;
  }

  static formatCurrency(amount: number, currency: string = 'USD'): string {
    // List of crypto currencies that are not valid ISO 4217 currency codes
    const cryptoCurrencies = [
      'USDT', 'USDC', 'EURC', 'PYSD', 'USDG', 'USDS', 'SOL', 'BTC', 'ETH', 
      'SUI', 'HYPE', 'TRX', 'BNB', 'XRP', 'DOGE', 'ADA'
    ];
    
    if (cryptoCurrencies.includes(currency.toUpperCase())) {
      // For crypto currencies, use manual formatting
      const formattedAmount = amount.toFixed(8).replace(/\.?0+$/, ''); // Remove trailing zeros
      return `${formattedAmount} ${currency.toUpperCase()}`;
    }
    
    // For standard fiat currencies, use Intl.NumberFormat
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback for invalid currency codes
      console.warn(`Invalid currency code: ${currency}, using manual formatting`);
      return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
    }
  }

  static getBaseCurrencyAmount(amount: number, currency: string, baseCurrency: string = 'USD'): number {
    // In a real app, you'd fetch exchange rates
    // For now, assume 1:1 conversion for simplicity
    // console.log(`Converting ${amount} ${currency} to ${baseCurrency}`); // Using parameters to avoid linting errors
    return amount;
  }

  static filterTransactionsByPeriod(
    transactions: Transaction[], 
    period: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom',
    customDateRange?: { start: string; end: string }
  ): Transaction[] {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const endOfThisYear = new Date(now.getFullYear(), 11, 31);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

    switch (period) {
      case 'thisMonth':
        return transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startOfThisMonth && transactionDate <= endOfThisMonth;
        });
      case 'lastMonth':
        return transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth;
        });
      case 'thisYear':
        return transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startOfThisYear && transactionDate <= endOfThisYear;
        });
      case 'lastYear':
        return transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startOfLastYear && transactionDate <= endOfLastYear;
        });
      case 'custom':
        if (customDateRange && customDateRange.start && customDateRange.end) {
          const startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= startDate && transactionDate <= endDate;
          });
        }
        return transactions;
      case 'allTime':
      default:
        return transactions;
    }
  }

  static filterTransactionsByCompany(
    transactions: Transaction[], 
    companyId: number | 'all'
  ): Transaction[] {
    if (companyId === 'all') {
      return transactions;
    }
    return transactions.filter(transaction => transaction.companyId === companyId);
  }

  static filterTransactionsByAccountType(
    transactions: Transaction[], 
    filterBy: 'all' | 'banks' | 'wallets'
  ): Transaction[] {
    if (filterBy === 'banks') {
      return transactions.filter(transaction => transaction.accountType === 'bank');
    } else if (filterBy === 'wallets') {
      return transactions.filter(transaction => transaction.accountType === 'wallet');
    }
    return transactions;
  }

  static filterTransactionsByType(
    transactions: Transaction[], 
    viewFilter: 'all' | 'incoming' | 'outgoing'
  ): Transaction[] {
    if (viewFilter === 'incoming') {
      return transactions.filter(transaction => (transaction.incomingAmount || 0) > 0);
    } else if (viewFilter === 'outgoing') {
      return transactions.filter(transaction => (transaction.outgoingAmount || 0) > 0);
    }
    return transactions;
  }

  static filterTransactionsBySearch(
    transactions: Transaction[], 
    searchTerm: string
  ): Transaction[] {
    if (!searchTerm) return transactions;
    
    const term = searchTerm.toLowerCase();
    return transactions.filter(transaction => 
      transaction.paidBy.toLowerCase().includes(term) ||
      transaction.paidTo.toLowerCase().includes(term) ||
      transaction.reference?.toLowerCase().includes(term) ||
      transaction.description?.toLowerCase().includes(term) ||
      transaction.notes?.toLowerCase().includes(term) ||
      transaction.category?.toLowerCase().includes(term)
    );
  }

  static getFilteredTransactions(
    transactions: Transaction[],
    companyId: number | 'all',
    period: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom',
    customDateRange: { start: string; end: string },
    filterBy: 'all' | 'banks' | 'wallets',
    viewFilter: 'all' | 'incoming' | 'outgoing',
    searchTerm: string
  ): Transaction[] {
    let filtered = this.filterTransactionsByCompany(transactions, companyId);
    filtered = this.filterTransactionsByPeriod(filtered, period, customDateRange);
    filtered = this.filterTransactionsByAccountType(filtered, filterBy);
    filtered = this.filterTransactionsByType(filtered, viewFilter);
    filtered = this.filterTransactionsBySearch(filtered, searchTerm);
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static groupTransactions(
    transactions: Transaction[],
    groupBy: 'none' | 'month' | 'account' | 'currency',
    bankAccounts: BankAccount[],
    digitalWallets: DigitalWallet[]
  ): Array<{ key: string; name: string; transactions: Transaction[] }> {
    if (groupBy === 'none') {
      return [{ key: 'All Transactions', name: 'All Transactions', transactions }];
    }

    const grouped: { [key: string]: Transaction[] } = {};

    transactions.forEach(transaction => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'month':
          const date = new Date(transaction.date);
          groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'account':
          const account = this.getAccountById(transaction.accountId, transaction.accountType, bankAccounts, digitalWallets);
          if (account) {
            if (transaction.accountType === 'bank') {
              const bankAccount = account as BankAccount;
              groupKey = `${bankAccount.bankName} - ${bankAccount.accountName}`;
            } else {
              const wallet = account as DigitalWallet;
              groupKey = `${wallet.walletName} (${wallet.walletType})`;
            }
          } else {
            groupKey = 'Unknown Account';
          }
          break;
        case 'currency':
          groupKey = transaction.currency;
          break;
        default:
          groupKey = 'All Transactions';
      }

      if (groupKey) {
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(transaction);
      }
    });

    return Object.entries(grouped)
      .map(([key, transactions]) => ({ key, name: key, transactions }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static getAccountById(
    accountId: string, 
    accountType: 'bank' | 'wallet',
    bankAccounts: BankAccount[],
    digitalWallets: DigitalWallet[]
  ): BankAccount | DigitalWallet | undefined {
    if (accountType === 'bank') {
      return bankAccounts.find(acc => acc.id === accountId);
    }
    return digitalWallets.find(acc => acc.id === accountId);
  }

  static getLinkableEntries(
    entries: BookkeepingEntry[],
    transactions: Transaction[],
    bulkAddType: 'incoming' | 'outgoing',
    companyId: number | 'all'
  ): BookkeepingEntry[] {
    const linkedEntryIds = new Set(transactions.map(t => t.linkedEntryId).filter(Boolean));
    const typeToLink = bulkAddType === 'incoming' ? 'revenue' : 'expense';
    
    return entries.filter(e => 
      e.type === typeToLink && 
      !linkedEntryIds.has(e.id) &&
      (companyId === 'all' || e.companyId === companyId)
    );
  }

  static getLinkableEntriesByType(
    entries: BookkeepingEntry[],
    transactions: Transaction[],
    companyId: number | 'all'
  ): { income: BookkeepingEntry[]; expense: BookkeepingEntry[] } {
    const linkedEntryIds = new Set(transactions.map(t => t.linkedEntryId).filter(Boolean));
    
    return {
      income: entries.filter(e => 
        e.type === 'revenue' && 
        !linkedEntryIds.has(e.id) && 
        (companyId === 'all' || e.companyId === companyId)
      ),
      expense: entries.filter(e => 
        e.type === 'expense' && 
        !linkedEntryIds.has(e.id) && 
        (companyId === 'all' || e.companyId === companyId)
      )
    };
  }

  static getMostUsedAccountForCompany(
    transactions: Transaction[],
    bankAccounts: BankAccount[],
    digitalWallets: DigitalWallet[],
    companyId: number | 'all'
  ): string {
    if (companyId === 'all') return '';
    
    const companyTransactions = transactions.filter(t => t.companyId === companyId);
    
    if (companyTransactions.length === 0) {
      // If no transactions, return first available account for the company
      const firstBankAccount = bankAccounts.find(acc => acc.companyId === companyId);
      if (firstBankAccount) return firstBankAccount.id;
      
      const firstWallet = digitalWallets.find(acc => acc.companyId === companyId);
      if (firstWallet) return firstWallet.id;
      
      return '';
    }
    
    // Count usage of each account
    const accountUsage = companyTransactions.reduce((acc, transaction) => {
      acc[transaction.accountId] = (acc[transaction.accountId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Return the most used account
    return Object.entries(accountUsage).reduce((a, b) => accountUsage[a[0]] > accountUsage[b[0]] ? a : b)[0] || '';
  }

  static validateBulkTransactions(
    bulkTransactions: BulkTransaction[],
    bulkAddType: 'incoming' | 'outgoing'
  ): BulkTransaction[] {
    return bulkTransactions.filter(transaction => {
      const hasAmount = transaction.amount.trim() !== '';
      const hasRequiredParty = bulkAddType === 'incoming' 
        ? transaction.paidBy.trim() !== '' 
        : transaction.paidTo.trim() !== '';
      return hasAmount && hasRequiredParty;
    });
  }

  static createTransactionFromBulk(
    transaction: BulkTransaction,
    bulkAddType: 'incoming' | 'outgoing',
    companyId: number,
    accountId: string,
    companies: Company[],
    bankAccounts: BankAccount[]
  ): Transaction {
    const amount = parseFloat(transaction.amount);
    const tax = parseFloat(transaction.tax) || 0;
    
    const isIncoming = bulkAddType === 'incoming';
    const netAmount = isIncoming ? amount : -amount;
    const baseCurrencyAmount = this.getBaseCurrencyAmount(Math.abs(netAmount), transaction.currency);

    // Get company name for proper paid by/to assignment
    const selectedCompany = companies.find(c => c.id === companyId);
    const companyName = selectedCompany ? selectedCompany.tradingName : 'Company';

    return {
      id: this.generateTransactionId(),
      companyId: companyId,
      date: transaction.date,
      paidBy: isIncoming ? (transaction.paidBy || 'Customer') : companyName,
      paidTo: isIncoming ? companyName : (transaction.paidTo || 'Vendor'),
      reference: transaction.reference,
      incomingAmount: isIncoming ? amount : undefined,
      incomingTax: isIncoming ? tax : undefined,
      outgoingAmount: !isIncoming ? amount : undefined,
      outgoingTax: !isIncoming ? tax : undefined,
      netAmount,
      currency: transaction.currency,
      baseCurrency: 'USD',
      baseCurrencyAmount,
      category: transaction.category,
      description: transaction.description,
      notes: transaction.notes,
      linkedEntryId: transaction.linkedEntryId || undefined,
      linkedEntryType: transaction.linkedEntryId ? (isIncoming ? 'revenue' : 'expense') : undefined,
      accountId: accountId,
      accountType: bankAccounts.some(b => b.id === accountId) ? 'bank' : 'wallet',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Transaction;
  }

  static updateBulkTransactionFromEntry(
    transaction: BulkTransaction,
    entry: BookkeepingEntry,
    bulkAddType: 'incoming' | 'outgoing'
  ): BulkTransaction {
    const updatedTransaction = { ...transaction };
    
    updatedTransaction.amount = entry.amount.toString();
    updatedTransaction.category = entry.category;
    updatedTransaction.description = entry.description;
    updatedTransaction.reference = entry.reference || '';
    updatedTransaction.tax = '0'; // Assuming no tax info on entry for now
    
    // Auto-fill "Paid by" for incoming transactions with client name from linked invoice
    if (bulkAddType === 'incoming' && entry.isFromInvoice && entry.invoiceId) {
      const savedInvoices = localStorage.getItem('app-invoices');
      if (savedInvoices) {
        try {
          const invoices = JSON.parse(savedInvoices);
          const invoice = invoices.find((inv: { id: string; clientName?: string }) => inv.id === entry.invoiceId);
          if (invoice && invoice.clientName) {
            updatedTransaction.paidBy = invoice.clientName;
          }
        } catch (error) {
          console.error('Error parsing saved invoices:', error);
        }
      }
    }
    
    // Auto-fill "Paid to" for outgoing transactions based on entry type  
    if (bulkAddType === 'outgoing' && entry.vendorInvoice) {
      // If it's a vendor expense, try to extract vendor name
      updatedTransaction.paidTo = entry.vendorInvoice;
    }
    
    return updatedTransaction;
  }

  static calculateSummary(transactions: Transaction[]): {
    totalTransactions: number;
    totalIncoming: number;
    totalOutgoing: number;
    netAmount: number;
    thisMonth: number;
  } {
    const totalIncoming = transactions.reduce((sum, t) => sum + (t.incomingAmount || 0), 0);
    const totalOutgoing = transactions.reduce((sum, t) => sum + (t.outgoingAmount || 0), 0);
    const netAmount = totalIncoming - totalOutgoing;
    
    return {
      totalTransactions: transactions.length,
      totalIncoming,
      totalOutgoing,
      netAmount,
      thisMonth: transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const now = new Date();
        return transactionDate.getMonth() === now.getMonth() && 
               transactionDate.getFullYear() === now.getFullYear();
      }).length
    };
  }
}