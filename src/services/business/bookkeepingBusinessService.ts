import { 
  BookkeepingEntry, 
  CompanyAccount, 
  FinancialSummary, 
  ExpenseBreakdownItem, 
  PeriodFilter,
  BookkeepingFormData,
  AccountFormData,
  JournalEntry,
  JournalEntryLine,
  JournalEntryFormData,
  JournalEntryLineFormData,
  TrialBalance,
  TrialBalanceAccount,
  AccountBalance
} from '@/types';
import { Invoice, Product, ChartOfAccount } from '@/types';
import { JournalEntryStorageService } from '@/services/storage';
import { UserManagementService } from './userManagementService';

interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  phone: string;
  website: string;
  paymentTerms: number;
  currency: string;
  paymentMethod: string;
  billingAddress: string;
  itemsServicesSold: string;
  notes: string;
  companyRegistrationNr: string;
  vatNr: string;
  vendorCountry: string;
  companyId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface COGSCalculation {
  amount: number;
  currency: string;
}

export class BookkeepingBusinessService {
  // Journal entry counter for generating entry numbers
  private static journalEntryCounter: number = 1;

  /**
   * Get the next journal entry number
   */
  private static getNextEntryNumber(): string {
    // Get existing entries to determine the next number
    const existingEntries = JournalEntryStorageService.getJournalEntries();
    
    if (existingEntries.length === 0) {
      this.journalEntryCounter = 1;
    } else {
      // Find the highest entry number
      const entryNumbers = existingEntries
        .map(entry => entry.entryNumber)
        .filter(num => num.startsWith('JE-'))
        .map(num => parseInt(num.replace('JE-', '')))
        .filter(num => !isNaN(num));
      
      this.journalEntryCounter = entryNumbers.length > 0 ? Math.max(...entryNumbers) + 1 : 1;
    }
    
    return `JE-${this.journalEntryCounter.toString().padStart(3, '0')}`;
  }
  static roundToTwoDecimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  static generateEntryId(): string {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateJournalEntryId(): string {
    return `je_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateJournalEntryNumber(): string {
    return this.getNextEntryNumber();
  }

  static generateJournalEntryLineId(): string {
    return `jel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateAccountId(): string {
    return `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createEntryFromFormData(formData: BookkeepingFormData): BookkeepingEntry {
    return {
      id: this.generateEntryId(),
      type: formData.type,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      description: formData.description,
      date: formData.date,
      companyId: parseInt(formData.companyId),
      reference: formData.reference || undefined,
      accountId: formData.accountId || undefined,
      accountType: formData.accountType,
      chartOfAccountsId: formData.chartOfAccountsId || undefined,
      ...(formData.type === 'income' && {
        cogs: formData.cogs ? this.roundToTwoDecimals(parseFloat(formData.cogs)) : undefined,
        cogsPaid: formData.cogsPaid ? this.roundToTwoDecimals(parseFloat(formData.cogsPaid)) : undefined
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static updateEntryFromFormData(existingEntry: BookkeepingEntry, formData: BookkeepingFormData): BookkeepingEntry {
    return {
      ...existingEntry,
      type: formData.type,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      description: formData.description,
      date: formData.date,
      companyId: parseInt(formData.companyId),
      reference: formData.reference || undefined,
      accountId: formData.accountId || undefined,
      accountType: formData.accountType,
      chartOfAccountsId: formData.chartOfAccountsId || undefined,
      cogs: formData.cogs ? this.roundToTwoDecimals(parseFloat(formData.cogs)) : undefined,
      cogsPaid: formData.cogsPaid ? this.roundToTwoDecimals(parseFloat(formData.cogsPaid)) : undefined,
      updatedAt: new Date().toISOString()
    };
  }

  static createAccountFromFormData(formData: AccountFormData): CompanyAccount {
    return {
      id: this.generateAccountId(),
      companyId: parseInt(formData.companyId),
      type: formData.type,
      name: formData.name,
      accountNumber: formData.accountNumber || undefined,
      currency: formData.currency,
      startingBalance: parseFloat(formData.startingBalance),
      currentBalance: parseFloat(formData.startingBalance),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static filterEntriesByPeriod(entries: BookkeepingEntry[], period: PeriodFilter): BookkeepingEntry[] {
    const now = new Date();
    const periodStart = new Date();
    const periodEnd = new Date();

    switch (period) {
      case 'thisMonth':
        periodStart.setDate(1);
        periodEnd.setMonth(periodEnd.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        periodStart.setMonth(now.getMonth() - 1, 1);
        periodEnd.setMonth(now.getMonth(), 0);
        break;
      case 'thisYear':
        periodStart.setMonth(0, 1);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1, 0, 0);
        break;
      case 'lastYear':
        periodStart.setFullYear(now.getFullYear() - 1, 0, 1);
        periodEnd.setFullYear(now.getFullYear(), 0, 0);
        break;
      case 'allTime':
        return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= periodStart && entryDate <= periodEnd;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static filterEntriesByCompany(entries: BookkeepingEntry[], companyId: number | 'all'): BookkeepingEntry[] {
    if (companyId === 'all') {
      return entries;
    }
    return entries.filter(entry => entry.companyId === companyId);
  }

  static calculateFinancialSummary(entries: BookkeepingEntry[]): FinancialSummary {
    // Ensure entries is an array and filter out invalid entries
    const validEntries = (entries || []).filter(entry => entry && typeof entry.amount === 'number' && !isNaN(entry.amount));
    
    const income = validEntries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const cogs = validEntries
      .filter(entry => entry.type === 'income' && entry.cogs)
      .reduce((sum, entry) => sum + (entry.cogs || 0), 0);
    
    const actualExpenses = validEntries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const actualCogsPaid = validEntries
      .filter(entry => entry.type === 'income' && entry.cogsPaid)
      .reduce((sum, entry) => sum + (entry.cogsPaid || 0), 0);
    
    const totalActualExpenses = actualExpenses + actualCogsPaid;
    const accountsPayable = cogs - actualCogsPaid;
    const netProfit = income - totalActualExpenses;
    
    return {
      revenue: income || 0,
      cogs: cogs || 0,
      actualExpenses: totalActualExpenses || 0,
      accountsPayable: Math.max(0, accountsPayable || 0),
      netProfit: netProfit || 0
    };
  }

  static getExpenseBreakdown(entries: BookkeepingEntry[]): ExpenseBreakdownItem[] {
    const expenseEntries = entries.filter(entry => entry.type === 'expense');
    const breakdown: { [category: string]: number } = {};
    
    expenseEntries.forEach(entry => {
      breakdown[entry.category] = (breakdown[entry.category] || 0) + entry.amount;
    });
    
    return Object.entries(breakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }

  static calculateInvoiceCOGS(invoice: Invoice, products: Product[]): COGSCalculation {
    let totalCOGS = 0;
    let cogsCurrency = 'USD';
    
    invoice.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        totalCOGS += product.cost * item.quantity;
        if (cogsCurrency === 'USD' && product.costCurrency) {
          cogsCurrency = product.costCurrency;
        }
      }
    });
    
    return {
      amount: this.roundToTwoDecimals(totalCOGS),
      currency: cogsCurrency
    };
  }

  static createAutoEntryFromInvoice(
    invoice: Invoice, 
    calculatedCOGS: COGSCalculation
  ): BookkeepingEntry {
    return {
      id: `auto_${invoice.id}_${Date.now()}`,
      type: 'income',
      category: 'Sales Revenue',
      amount: invoice.totalAmount,
      currency: invoice.currency,
      description: `Invoice ${invoice.invoiceNumber} - ${invoice.clientName}`,
      date: invoice.paidDate || invoice.issueDate,
      companyId: invoice.fromCompanyId,
      reference: invoice.invoiceNumber,
      isFromInvoice: true,
      invoiceId: invoice.id,
      cogs: calculatedCOGS.amount,
      cogsPaid: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static updateAccountBalance(
    account: CompanyAccount, 
    amount: number, 
    type: 'income' | 'expense'
  ): CompanyAccount {
    let balanceChange = 0;
    if (type === 'income') {
      balanceChange = amount;
    } else if (type === 'expense') {
      balanceChange = -amount;
    }
    
    return {
      ...account,
      currentBalance: account.currentBalance + balanceChange,
      updatedAt: new Date().toISOString()
    };
  }

  static formatLargeCurrency(amount: number | undefined | null, currency: string = 'USD'): string {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
    const safeAmount = amount ?? 0;
    return `${symbol}${safeAmount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  static getAccountsPayable(entry: BookkeepingEntry): number {
    if (entry.type === 'income' && entry.cogs) {
      return (entry.cogs || 0) - (entry.cogsPaid || 0);
    }
    return 0;
  }

  static shouldRecalculateCOGS(entry: BookkeepingEntry, calculatedCOGS: COGSCalculation): boolean {
    return entry.type === 'income' && 
           entry.isFromInvoice && 
           entry.invoiceId && 
           entry.cogs !== undefined &&
           Math.abs(calculatedCOGS.amount - entry.cogs) > 0.01;
  }

  // Enhanced invoice analysis functions
  static getInvoiceProducts(invoice: Invoice, products: Product[]): Product[] {
    return invoice.items
      .map(item => products.find(p => p.id === item.productId))
      .filter((product): product is Product => product !== undefined);
  }

  static getInvoiceVendor(invoice: Invoice, vendors: Vendor[], products: Product[]): Vendor | null {
    const invoiceProducts = this.getInvoiceProducts(invoice, products);
    if (invoiceProducts.length === 0) return null;
    
    // Get vendor from first product that has one
    const productWithVendor = invoiceProducts.find(p => p.vendorId);
    if (!productWithVendor?.vendorId) return null;
    
    return vendors.find(v => v.id === productWithVendor.vendorId) || null;
  }

  static getSuggestedCurrencyForInvoice(
    invoice: Invoice, 
    calculatedCOGS: COGSCalculation,
    invoiceProducts: Product[],
    invoiceVendor: Vendor | null
  ): string {
    // Auto-fill currency based on priority: product cost currency > product price currency > vendor currency > USD
    let suggestedCurrency = 'USD';
    if (calculatedCOGS.amount > 0 && calculatedCOGS.currency !== 'USD') {
      // If we have COGS with a specific currency, use that for expense tracking
      suggestedCurrency = calculatedCOGS.currency;
    } else if (invoiceProducts.length > 0) {
      suggestedCurrency = invoiceProducts[0].currency; // Use first product's price currency
    } else if (invoiceVendor) {
      suggestedCurrency = invoiceVendor.currency;
    }
    return suggestedCurrency;
  }

  // Linked expenses functions
  static getLinkedExpenses(entries: BookkeepingEntry[], incomeId: string): BookkeepingEntry[] {
    return entries.filter(entry => entry.type === 'expense' && entry.linkedIncomeId === incomeId);
  }

  static getTotalLinkedExpenses(entries: BookkeepingEntry[], incomeId: string): number {
    const linkedExpenses = this.getLinkedExpenses(entries, incomeId);
    return linkedExpenses.reduce((total, expense) => total + expense.amount, 0);
  }

  static getRemainingAmount(entry: BookkeepingEntry, entries: BookkeepingEntry[]): number {
    const totalExpenses = this.getTotalLinkedExpenses(entries, entry.id);
    // A/P = COGS - Expenses Paid (not Income - Expenses)
    const cogs = entry.cogs || 0;
    return cogs - totalExpenses;
  }

  // COGS calculation function
  static calculateInvoiceCOGS(invoice: any, products: Product[]): { amount: number; currency: string } {
    const invoiceProducts = products.filter(p => 
      invoice.items.some((item: any) => item.productId === p.id)
    );
    let totalCOGS = 0;
    let cogsCurrency = 'USD';
    
    invoice.items.forEach((item: any) => {
      const product = invoiceProducts.find(p => p.id === item.productId);
      if (product) {
        totalCOGS += product.cost * item.quantity;
        if (cogsCurrency === 'USD' && product.costCurrency) {
          cogsCurrency = product.costCurrency;
        }
      }
    });
    
    return {
      amount: Math.round((totalCOGS + Number.EPSILON) * 100) / 100,
      currency: cogsCurrency
    };
  }

  static getCOGSCurrency(entry: BookkeepingEntry, invoices: Invoice[], products: Product[]): string {
    if (entry.reference) {
      // Look for invoice in the reference (format: "Invoice INV-202506-0011")
      const invoiceMatch = entry.reference.match(/Invoice\s+(INV-[0-9-]+)/i);
      if (invoiceMatch) {
        const invoiceNumber = invoiceMatch[1];
        const relatedInvoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
        
        if (relatedInvoice) {
          const calculatedCOGS = this.calculateInvoiceCOGS(relatedInvoice, products);
          // Always return the calculated COGS currency, whether it's USD or not
          return calculatedCOGS.currency;
        }
      }
    }
    
    // Fallback to entry currency if we can't determine COGS currency
    return entry.currency;
  }

  // Invoice filtering for dropdown
  static getFilteredInvoicesForDropdown(
    invoices: Invoice[], 
    companyId: string, 
    searchTerm: string
  ): Invoice[] {
    let filtered = invoices
      .filter(invoice => !companyId || invoice.fromCompanyId === parseInt(companyId))
      .filter(invoice => invoice.status === 'paid' || invoice.status === 'sent');

    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.items.some(item => 
          item.productName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filtered;
  }

  // Get available income entries for linking
  static getAvailableIncomeEntriesForLinking(
    entries: BookkeepingEntry[], 
    expenseEntry: BookkeepingEntry
  ): BookkeepingEntry[] {
    return entries.filter(entry => 
      entry.type === 'income' && 
      entry.companyId === expenseEntry.companyId &&
      entry.id !== expenseEntry.id
    );
  }

  // Additional filtering functions
  static filterEntriesByType(entries: BookkeepingEntry[], type: 'all' | 'income' | 'expense'): BookkeepingEntry[] {
    if (type === 'all') return entries;
    return entries.filter(entry => entry.type === type);
  }

  static filterEntriesByCustomDateRange(
    entries: BookkeepingEntry[], 
    startDate: string, 
    endDate: string
  ): BookkeepingEntry[] {
    if (!startDate || !endDate) return entries;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= start && entryDate <= end;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Group entries by month/year
  static groupEntriesByMonth(entries: BookkeepingEntry[]): { [key: string]: BookkeepingEntry[] } {
    const grouped: { [key: string]: BookkeepingEntry[] } = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(entry);
    });
    
    return grouped;
  }

  // Validation functions for bulk operations
  static validateBulkEntries(bulkEntries: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    bulkEntries.forEach((entry, index) => {
      // Description is optional for all entry types
      if (!entry.amount || isNaN(parseFloat(entry.amount))) {
        errors.push(`Entry ${index + 1}: Valid amount is required`);
      }
      if (!entry.category?.trim()) {
        errors.push(`Entry ${index + 1}: Category is required`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // =============================================================================
  // JOURNAL ENTRY METHODS - Double-Entry Bookkeeping
  // =============================================================================

  /**
   * Create a journal entry from form data with double-entry validation
   */
  static createJournalEntry(formData: JournalEntryFormData): JournalEntry {
    const lines: JournalEntryLine[] = formData.lines.map(lineData => ({
      id: this.generateJournalEntryLineId(),
      accountId: lineData.accountId,
      description: lineData.description,
      debit: parseFloat(lineData.debit) || 0,
      credit: parseFloat(lineData.credit) || 0,
      reference: lineData.reference
    }));

    const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01; // Allow for rounding

    if (!isBalanced) {
      throw new Error(`Journal entry is not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`);
    }

    if (lines.length < 2) {
      throw new Error('Journal entry must have at least 2 lines');
    }

    // Get current user for audit trail
    const currentUser = UserManagementService.getCurrentUser();
    const now = new Date().toISOString();

    const journalEntry: JournalEntry = {
      id: this.generateJournalEntryId(),
      entryNumber: '', // Will be assigned by storage service
      date: formData.date,
      description: formData.description,
      reference: formData.reference,
      companyId: parseInt(formData.companyId),
      lines,
      totalDebits: this.roundToTwoDecimals(totalDebits),
      totalCredits: this.roundToTwoDecimals(totalCredits),
      isBalanced,
      source: 'manual',
      status: formData.status || 'draft', // Use status from form, default to draft
      
      // Audit trail fields
      createdBy: currentUser.id,
      createdByName: currentUser.fullName,
      lastModifiedBy: currentUser.id,
      lastModifiedByName: currentUser.fullName,
      
      // Auto-approve and post if status is posted
      ...(formData.status === 'posted' && {
        approvedBy: currentUser.id,
        approvedByName: currentUser.fullName,
        approvedAt: now,
        postedBy: currentUser.id,
        postedByName: currentUser.fullName,
        postedAt: now
      }),
      
      createdAt: now,
      updatedAt: now
    };

    // Store the journal entry using persistent storage
    const success = JournalEntryStorageService.addJournalEntry(journalEntry);
    if (!success) {
      throw new Error('Failed to save journal entry to storage');
    }

    // Log the audit action
    UserManagementService.logAction(
      'create',
      'journal-entry',
      journalEntry.id,
      `Created journal entry ${journalEntry.entryNumber}: ${journalEntry.description} (${journalEntry.status})`
    );

    // If posted immediately, log additional action
    if (formData.status === 'posted') {
      UserManagementService.logAction(
        'post',
        'journal-entry',
        journalEntry.id,
        `Posted journal entry ${journalEntry.entryNumber} for ${this.formatLargeCurrency(journalEntry.totalDebits)}`
      );
    }

    return journalEntry;
  }

  /**
   * Get journal entries by period (this was missing and causing errors in financial statements)
   */
  static getTransactionsByPeriod(startDate: Date, endDate: Date): JournalEntry[] {
    try {
      const entries = JournalEntryStorageService.getJournalEntriesByPeriod(startDate, endDate);
      
      if (!entries || entries.length === 0) {
        console.warn('No journal entries found for the specified period:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        return [];
      }
      
      return entries;
    } catch (error) {
      console.error('Error retrieving journal entries by period:', error);
      return [];
    }
  }

  /**
   * Get all journal entries for a company
   */
  static getJournalEntries(companyId?: number): JournalEntry[] {
    try {
      const allEntries = JournalEntryStorageService.getJournalEntries();
      
      if (!allEntries || allEntries.length === 0) {
        console.warn('No journal entries found in storage');
        return [];
      }
      
      const filteredEntries = companyId 
        ? allEntries.filter(entry => entry.companyId === companyId && entry.status === 'posted')
        : allEntries.filter(entry => entry.status === 'posted');
      
      if (filteredEntries.length === 0) {
        console.warn(`No posted journal entries found${companyId ? ` for company ${companyId}` : ''}`);
      }
      
      return filteredEntries;
    } catch (error) {
      console.error('Error retrieving journal entries:', error);
      return [];
    }
  }

  /**
   * Calculate trial balance as of a specific date
   */
  static calculateTrialBalance(asOfDate: Date, companyId?: number): TrialBalance {
    const entries = this.journalEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const isInPeriod = entryDate <= asOfDate && entry.status === 'posted';
      const isCompanyMatch = !companyId || entry.companyId === companyId;
      return isInPeriod && isCompanyMatch;
    });

    const accountBalances: { [accountId: string]: TrialBalanceAccount } = {};

    // Process all journal entry lines
    entries.forEach(entry => {
      entry.lines.forEach(line => {
        if (!accountBalances[line.accountId]) {
          accountBalances[line.accountId] = {
            accountId: line.accountId,
            accountCode: line.accountCode || '',
            accountName: line.accountName || '',
            accountType: 'Assets', // This should be fetched from Chart of Accounts
            debitBalance: 0,
            creditBalance: 0,
            netBalance: 0
          };
        }

        accountBalances[line.accountId].debitBalance += line.debit;
        accountBalances[line.accountId].creditBalance += line.credit;
      });
    });

    // Calculate net balances and totals
    let totalDebits = 0;
    let totalCredits = 0;

    const accounts = Object.values(accountBalances).map(account => {
      account.netBalance = account.debitBalance - account.creditBalance;
      
      // Add to trial balance totals (only positive balances)
      if (account.netBalance > 0) {
        totalDebits += account.netBalance;
      } else {
        totalCredits += Math.abs(account.netBalance);
      }

      return account;
    });

    return {
      asOfDate: asOfDate.toISOString(),
      companyId: companyId || 0,
      accounts,
      totalDebits: this.roundToTwoDecimals(totalDebits),
      totalCredits: this.roundToTwoDecimals(totalCredits),
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Get account balances for financial statement generation
   */
  static getAccountBalances(startDate: Date, endDate: Date, companyId?: number): AccountBalance[] {
    const entries = this.getTransactionsByPeriod(startDate, endDate);
    const filteredEntries = companyId ? entries.filter(e => e.companyId === companyId) : entries;

    const accountBalances: { [accountId: string]: AccountBalance } = {};

    filteredEntries.forEach(entry => {
      entry.lines.forEach(line => {
        if (!accountBalances[line.accountId]) {
          accountBalances[line.accountId] = {
            accountId: line.accountId,
            accountCode: line.accountCode || '',
            accountName: line.accountName || '',
            accountType: 'Assets', // Should be fetched from Chart of Accounts
            balance: 0,
            totalDebits: 0,
            totalCredits: 0
          };
        }

        accountBalances[line.accountId].totalDebits += line.debit;
        accountBalances[line.accountId].totalCredits += line.credit;
      });
    });

    // Calculate net balances based on account type
    return Object.values(accountBalances).map(account => {
      // For now, assume normal balance rules:
      // Assets, Expenses: Debit normal (debit - credit)
      // Liabilities, Equity, Revenue: Credit normal (credit - debit)
      if (account.accountType === 'Assets' || account.accountType === 'Expense') {
        account.balance = account.totalDebits - account.totalCredits;
      } else {
        account.balance = account.totalCredits - account.totalDebits;
      }
      
      return account;
    });
  }

  /**
   * Transform existing income/expense entry to journal entry
   */
  static convertEntryToJournalEntry(
    entry: BookkeepingEntry, 
    chartOfAccounts: ChartOfAccount[]
  ): JournalEntry {
    const lines: JournalEntryLine[] = [];

    if (entry.type === 'income') {
      // Income Entry: Debit Bank/Receivables, Credit Revenue
      const bankAccount = this.findBankAccount(chartOfAccounts);
      const revenueAccount = this.findRevenueAccount(entry.category, chartOfAccounts);

      lines.push({
        id: this.generateJournalEntryLineId(),
        accountId: bankAccount.id,
        accountCode: bankAccount.code,
        accountName: bankAccount.name,
        description: `Cash received - ${entry.description}`,
        debit: entry.amount,
        credit: 0
      });

      lines.push({
        id: this.generateJournalEntryLineId(),
        accountId: revenueAccount.id,
        accountCode: revenueAccount.code,
        accountName: revenueAccount.name,
        description: entry.description,
        debit: 0,
        credit: entry.amount
      });

      // If there's COGS, add those entries
      if (entry.cogs && entry.cogs > 0) {
        const cogsAccount = this.findCOGSAccount(chartOfAccounts);
        const inventoryAccount = this.findInventoryAccount(chartOfAccounts);

        lines.push({
          id: this.generateJournalEntryLineId(),
          accountId: cogsAccount.id,
          accountCode: cogsAccount.code,
          accountName: cogsAccount.name,
          description: `COGS - ${entry.description}`,
          debit: entry.cogs,
          credit: 0
        });

        lines.push({
          id: this.generateJournalEntryLineId(),
          accountId: inventoryAccount.id,
          accountCode: inventoryAccount.code,
          accountName: inventoryAccount.name,
          description: `Inventory reduction - ${entry.description}`,
          debit: 0,
          credit: entry.cogs
        });
      }
    } else {
      // Expense Entry: Debit Expense, Credit Bank/Payables
      const expenseAccount = this.findExpenseAccount(entry.category, chartOfAccounts);
      const bankAccount = this.findBankAccount(chartOfAccounts);

      lines.push({
        id: this.generateJournalEntryLineId(),
        accountId: expenseAccount.id,
        accountCode: expenseAccount.code,
        accountName: expenseAccount.name,
        description: entry.description,
        debit: entry.amount,
        credit: 0
      });

      lines.push({
        id: this.generateJournalEntryLineId(),
        accountId: bankAccount.id,
        accountCode: bankAccount.code,
        accountName: bankAccount.name,
        description: `Payment - ${entry.description}`,
        debit: 0,
        credit: entry.amount
      });
    }

    const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

    const journalEntry: JournalEntry = {
      id: this.generateJournalEntryId(),
      entryNumber: this.generateJournalEntryNumber(),
      date: entry.date,
      description: entry.description,
      reference: entry.reference,
      companyId: entry.companyId,
      lines,
      totalDebits: this.roundToTwoDecimals(totalDebits),
      totalCredits: this.roundToTwoDecimals(totalCredits),
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
      source: entry.type === 'income' ? 'auto-income' : 'auto-expense',
      sourceId: entry.id,
      status: 'posted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.journalEntries.push(journalEntry);
    return journalEntry;
  }

  /**
   * Helper methods to find accounts in Chart of Accounts
   */
  private static findBankAccount(chartOfAccounts: ChartOfAccount[]): ChartOfAccount {
    const bankAccount = chartOfAccounts.find(account => 
      account.type === 'Assets' && 
      (account.name.toLowerCase().includes('cash') || 
       account.name.toLowerCase().includes('bank') ||
       account.category === 'Cash and cash equivalents')
    );
    
    if (!bankAccount) {
      throw new Error('No bank/cash account found in Chart of Accounts');
    }
    
    return bankAccount;
  }

  private static findRevenueAccount(category: string, chartOfAccounts: ChartOfAccount[]): ChartOfAccount {
    const revenueAccount = chartOfAccounts.find(account => 
      account.type === 'Revenue' && 
      (account.name.toLowerCase().includes(category.toLowerCase()) ||
       account.category === category)
    );
    
    if (!revenueAccount) {
      // Fallback to generic revenue account
      const genericRevenue = chartOfAccounts.find(account => 
        account.type === 'Revenue'
      );
      
      if (!genericRevenue) {
        throw new Error('No revenue account found in Chart of Accounts');
      }
      
      return genericRevenue;
    }
    
    return revenueAccount;
  }

  private static findExpenseAccount(category: string, chartOfAccounts: ChartOfAccount[]): ChartOfAccount {
    const expenseAccount = chartOfAccounts.find(account => 
      account.type === 'Expense' && 
      (account.name.toLowerCase().includes(category.toLowerCase()) ||
       account.category === category)
    );
    
    if (!expenseAccount) {
      // Fallback to generic expense account
      const genericExpense = chartOfAccounts.find(account => 
        account.type === 'Expense'
      );
      
      if (!genericExpense) {
        throw new Error('No expense account found in Chart of Accounts');
      }
      
      return genericExpense;
    }
    
    return expenseAccount;
  }

  private static findCOGSAccount(chartOfAccounts: ChartOfAccount[]): ChartOfAccount {
    const cogsAccount = chartOfAccounts.find(account => 
      account.type === 'Expense' && 
      (account.name.toLowerCase().includes('cost of goods') ||
       account.name.toLowerCase().includes('cogs') ||
       account.category === 'Raw materials and consumables used')
    );
    
    if (!cogsAccount) {
      throw new Error('No COGS account found in Chart of Accounts');
    }
    
    return cogsAccount;
  }

  private static findInventoryAccount(chartOfAccounts: ChartOfAccount[]): ChartOfAccount {
    const inventoryAccount = chartOfAccounts.find(account => 
      account.type === 'Assets' && 
      (account.name.toLowerCase().includes('inventory') ||
       account.category === 'Finished goods' ||
       account.category === 'Raw materials')
    );
    
    if (!inventoryAccount) {
      throw new Error('No inventory account found in Chart of Accounts');
    }
    
    return inventoryAccount;
  }

  /**
   * Validate journal entry before posting
   */
  static validateJournalEntry(entry: JournalEntry): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!entry.description?.trim()) {
      errors.push('Description is required');
    }

    if (!entry.date) {
      errors.push('Date is required');
    }

    if (!entry.lines || entry.lines.length < 2) {
      errors.push('Journal entry must have at least 2 lines');
    }

    if (!entry.isBalanced) {
      errors.push(`Entry is not balanced. Debits: ${entry.totalDebits}, Credits: ${entry.totalCredits}`);
    }

    entry.lines.forEach((line, index) => {
      if (!line.accountId) {
        errors.push(`Line ${index + 1}: Account is required`);
      }
      
      if (line.debit === 0 && line.credit === 0) {
        errors.push(`Line ${index + 1}: Either debit or credit amount is required`);
      }
      
      if (line.debit > 0 && line.credit > 0) {
        errors.push(`Line ${index + 1}: Cannot have both debit and credit amounts`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}