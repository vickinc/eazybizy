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