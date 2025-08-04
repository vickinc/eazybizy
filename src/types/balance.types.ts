import { BankAccount, DigitalWallet } from './payment.types';
import { Company } from './company.types';

export type FilterPeriod = 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom';
export type AccountTypeFilter = 'all' | 'banks' | 'wallets';
export type BalanceViewFilter = 'all' | 'assets' | 'liabilities' | 'equity';
export type BalanceGroupBy = 'none' | 'account' | 'currency' | 'type';

export interface InitialBalance {
  id: string;
  accountId: string;
  accountType: 'bank' | 'wallet';
  amount: number;
  currency: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface CalculatedBalance {
  accountId: string;
  accountType: 'bank' | 'wallet';
  initialBalance: number;
  transactionBalance: number;
  finalBalance: number;
  currency: string;
  companyId: number;
  lastUpdated: string;
}

export interface CompanyAccountBalance {
  account: BankAccount | DigitalWallet;
  company: Company;
  initialBalance: number;
  transactionBalance: number;
  finalBalance: number;
  incomingAmount: number;
  outgoingAmount: number;
  currency: string;
  lastTransactionDate?: string;
}

// Alias for backward compatibility
export type AccountBalance = CompanyAccountBalance;

export interface BalanceFilterState {
  selectedPeriod: FilterPeriod;
  customDateRange: {
    startDate: string;
    endDate: string;
  };
  accountTypeFilter: AccountTypeFilter;
  viewFilter: BalanceViewFilter;
  groupBy: BalanceGroupBy;
  searchTerm: string;
  showZeroBalances: boolean;
}

export interface BalanceSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  // USD converted totals
  totalAssetsUSD: number;
  totalLiabilitiesUSD: number;
  netWorthUSD: number;
  baseCurrency: string; // Always "USD" for now
  // Account counts
  accountCount: number;
  bankAccountCount: number;
  walletCount: number;
  // Currency breakdown (in original currencies)
  currencyBreakdown: Record<string, {
    assets: number;
    liabilities: number;
    netWorth: number;
  }>;
}

export interface GroupedBalances {
  [key: string]: AccountBalance[];
}

export interface BalanceManagementState {
  balances: AccountBalance[];
  groupedBalances: GroupedBalances;
  summary: BalanceSummary;
  loading: boolean;
  error: string | null;
  filters: BalanceFilterState;
}