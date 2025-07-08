export interface FinancialPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  periodType: PeriodType;
  fiscalYear: number;
  isClosed: boolean;
  isActive: boolean;
  parentPeriodId?: string; // For quarterly periods within annual periods
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closedBy?: string;
}

export type PeriodType = 
  | 'Annual'
  | 'Interim' // Semi-annual
  | 'Quarterly'
  | 'Monthly'
  | 'Custom';

export interface FinancialYear {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  periods: FinancialPeriod[];
  createdAt: string;
  updatedAt: string;
}

export interface PeriodClosingData {
  periodId: string;
  closingEntries: PeriodClosingEntry[];
  retainedEarningsTransfer: RetainedEarningsTransfer;
  finalBalances: AccountBalance[];
  closedBy: string;
  closedAt: string;
  notes?: string;
}

export interface PeriodClosingEntry {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
  entryType: 'Income' | 'Expense' | 'Retained Earnings';
}

export interface RetainedEarningsTransfer {
  netIncome: number;
  retainedEarningsAccountId: string;
  transferDate: string;
  description: string;
}

export interface PeriodAccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  openingBalance: number;
  debitMovements: number;
  creditMovements: number;
  closingBalance: number;
  periodId: string;
}

export interface PeriodComparison {
  currentPeriod: FinancialPeriod;
  comparativePeriod: FinancialPeriod;
  accountBalances: ComparativeAccountBalance[];
}

export interface ComparativeAccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  currentBalance: number;
  comparativeBalance: number;
  variance: number;
  variancePercentage: number;
}

export interface FinancialPeriodsSettings {
  fiscalYearStartMonth: number; // 1-12, where 1 = January
  fiscalYearStartDay: number; // 1-31
  defaultPeriodType: PeriodType;
  autoCreatePeriods: boolean;
  requirePeriodClosing: boolean;
  allowPriorPeriodAdjustments: boolean;
  retainedEarningsAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodFilter {
  fiscalYear: number | 'all';
  periodType: PeriodType | 'all';
  status: 'open' | 'closed' | 'all';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface PeriodFormData {
  name: string;
  startDate: string;
  endDate: string;
  periodType: PeriodType;
  fiscalYear: number;
  parentPeriodId?: string;
}

// Constants for period management
export const PERIOD_TYPES: PeriodType[] = [
  'Annual',
  'Interim',
  'Quarterly', 
  'Monthly',
  'Custom'
];

export const PERIOD_TYPE_DESCRIPTIONS = {
  'Annual': 'Full financial year period (12 months)',
  'Interim': 'Semi-annual period (6 months)',
  'Quarterly': 'Quarterly period (3 months)',
  'Monthly': 'Monthly period (1 month)',
  'Custom': 'Custom date range period'
} as const;

export const FISCAL_YEAR_START_MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

// IFRS period requirements
export const IFRS_PERIOD_REQUIREMENTS = {
  minimumReportingFrequency: 'Annual',
  interimReportingRecommended: true,
  comparativePeriodRequired: true,
  consolidationPeriodAlignment: true,
  functionalCurrencyConsistency: true
} as const;

// Validation rules for periods
export interface PeriodValidationRule {
  rule: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
}

export const PERIOD_VALIDATION_RULES: PeriodValidationRule[] = [
  {
    rule: 'NO_OVERLAPPING_PERIODS',
    description: 'Periods cannot overlap within the same fiscal year',
    severity: 'error'
  },
  {
    rule: 'MINIMUM_PERIOD_LENGTH',
    description: 'Periods must be at least 1 day long',
    severity: 'error'
  },
  {
    rule: 'FISCAL_YEAR_ALIGNMENT',
    description: 'Periods should align with the defined fiscal year',
    severity: 'warning'
  },
  {
    rule: 'COMPARATIVE_PERIOD_AVAILABLE',
    description: 'Comparative period should be available for IFRS compliance',
    severity: 'info'
  },
  {
    rule: 'PERIOD_CLOSING_SEQUENCE',
    description: 'Periods should be closed in chronological order',
    severity: 'warning'
  }
];