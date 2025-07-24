export interface Transaction {
  id: string;
  companyId: number;
  date: string;
  paidBy: string;
  paidTo: string;
  netAmount: number;
  incomingAmount?: number;
  outgoingAmount?: number;
  currency: string;
  baseCurrency: string;
  baseCurrencyAmount: number;
  accountId: string;
  accountType: 'bank' | 'wallet';
  reference?: string;
  category?: string;
  description?: string;
  notes?: string;
  linkedEntryId?: string;
  linkedEntryType?: 'income' | 'expense';
  createdAt: string;
  updatedAt: string;
}

export interface CompanyBankAccount {
  id: string;
  companyId: number;
  bankName: string;
  accountName: string;
  accountNumber?: string;
  currency: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDigitalWallet {
  id: string;
  companyId: number;
  walletName: string;
  currency: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookkeepingEntry {
  id: string;
  type: 'revenue' | 'expense';
  category: string;
  subcategory?: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  companyId: number;
  reference?: string;
  isFromInvoice?: boolean;
  invoiceId?: string;
  accountId?: string;
  accountType?: 'bank' | 'wallet';
  createdAt: string;
  updatedAt: string;
  cogs?: number;
  cogsPaid?: number;
  vendorInvoice?: string;
  chartOfAccountsId?: string; // New field for Chart of Accounts reference
}

export interface CompanyAccount {
  id: string;
  companyId: number;
  type: 'bank' | 'wallet';
  name: string;
  accountNumber?: string;
  currency: string;
  startingBalance: number;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookkeepingFormData {
  type: 'revenue' | 'expense';
  category: string;
  subcategory: string;
  amount: string;
  currency: string;
  description: string;
  date: string;
  companyId: string;
  reference: string;
  accountId: string;
  accountType: 'bank' | 'wallet';
  cogs: string;
  cogsPaid: string;
  chartOfAccountsId: string; // New field for Chart of Accounts reference
}

export interface AccountFormData {
  companyId: string;
  type: 'bank' | 'wallet';
  name: string;
  accountNumber: string;
  currency: string;
  startingBalance: string;
}

export interface FinancialSummary {
  revenue: number;
  cogs: number;
  actualExpenses: number;
  accountsPayable: number;
  netProfit: number;
}

export interface ExpenseBreakdownItem {
  category: string;
  amount: number;
}

export type PeriodFilter = 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime';

export const INCOME_CATEGORIES = [
  'Sales Revenue',
  'Service Revenue', 
  'Product Sales',
  'Consulting',
  'Licensing',
  'Interest Revenue',
  'Investment Returns',
  'Other Revenue'
] as const;

export const EXPENSE_CATEGORIES = [
  'COGS',
  'Cost of Service',
  'Payroll and benefits',
  'Rent and utilities',
  'Supplies and equipment',
  'Marketing and advertising',
  'Insurance',
  'Taxes',
  'Travel and entertainment',
  'Professional services',
  'Inventory costs',
  'Debt payments',
  'Subscriptions and software',
  'Maintenance and repairs',
  'Other'
] as const;

export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// General Journal Entry Types - True Double-Entry Bookkeeping
export interface JournalEntryLine {
  id: string;
  accountId: string; // Reference to Chart of Accounts
  accountCode?: string; // Account code for reference
  accountName?: string; // Account name for display
  description?: string; // Line-specific description
  debit: number;
  credit: number;
  reference?: string; // Additional reference for this line
}

export interface JournalEntry {
  id: string;
  entryNumber: string; // Sequential journal entry number (e.g., "JE-001")
  date: string; // Transaction date
  description: string; // Main description of the transaction
  reference?: string; // External reference (invoice number, receipt, etc.)
  companyId: number;
  lines: JournalEntryLine[]; // Must have at least 2 lines
  totalDebits: number; // Sum of all debit amounts
  totalCredits: number; // Sum of all credit amounts
  isBalanced: boolean; // True if debits = credits
  source: 'manual' | 'auto-income' | 'auto-expense' | 'auto-invoice' | 'auto-fixed-asset'; // Source of the entry
  sourceId?: string; // ID of the source record (original entry ID, invoice ID, etc.)
  createdBy?: string; // User who created the entry
  createdByName?: string; // Display name of creator
  approvedBy?: string; // User who approved the entry (for approval workflow)
  approvedByName?: string; // Display name of approver
  approvedAt?: string; // When the entry was approved
  postedBy?: string; // User who posted the entry
  postedByName?: string; // Display name of poster
  postedAt?: string; // When the entry was posted
  lastModifiedBy?: string; // User who last modified the entry
  lastModifiedByName?: string; // Display name of last modifier
  status: 'draft' | 'posted' | 'reversed'; // Entry status
  reversalEntryId?: string; // If this entry was reversed, reference to the reversal entry
  reversedBy?: string; // User who reversed the entry
  reversedByName?: string; // Display name of reverser
  reversedAt?: string; // When the entry was reversed
  createdAt: string;
  updatedAt: string;
}

// Journal Entry Form Data for creating new entries
export interface JournalEntryFormData {
  date: string;
  description: string;
  reference?: string;
  companyId: string;
  status?: 'draft' | 'posted'; // Only allow draft/posted for form (reversed is system-generated)
  lines: JournalEntryLineFormData[];
}

export interface JournalEntryLineFormData {
  accountId: string;
  description?: string;
  debit: string; // String for form input
  credit: string; // String for form input
  reference?: string;
}

// Trial Balance Types
export interface TrialBalanceAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: 'Assets' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  debitBalance: number;
  creditBalance: number;
  netBalance: number; // Positive for normal balance side, negative for opposite
}

export interface TrialBalance {
  asOfDate: string;
  companyId: number;
  accounts: TrialBalanceAccount[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  generatedAt: string;
}

// Account Balance Types for Financial Statements
export interface BookkeepingAccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: 'Assets' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  balance: number; // Net balance (positive for normal balance side)
  totalDebits: number; // Total debits for the period
  totalCredits: number; // Total credits for the period
}