// Core Financial Statements Types for IFRS Compliance

// Base Financial Statement Item
export interface FinancialStatementItem {
  code: string;
  name: string;
  currentPeriod: number;
  priorPeriod?: number;
  variance?: number;
  variancePercent?: number;
  formattedCurrent: string;
  formattedPrior?: string;
  formattedVariance?: string;
  level: number; // 1 = main line, 2 = subtotal, 3 = total
  ifrsReference?: string;
  materialityFlag?: boolean;
}

// Financial Statement Section
export interface FinancialStatementSection {
  name: string;
  items: FinancialStatementItem[];
  total: number;
  priorTotal?: number;
  formattedTotal: string;
  formattedPriorTotal?: string;
  variance?: number;
  variancePercent?: number;
  formattedVariance?: string;
}

// Period Information
export interface StatementPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  fiscalYear: number;
  periodType: 'Annual' | 'Quarterly' | 'Monthly';
  isClosed: boolean;
}

// Statement Metadata
export interface StatementMetadata {
  companyName: string;
  statementTitle: string;
  currentPeriod: StatementPeriod;
  priorPeriod?: StatementPeriod;
  preparationDate: string;
  functionalCurrency: string;
  presentationCurrency: string;
  roundingUnit: string;
  materialityThreshold: number;
  ifrsCompliant: boolean;
  auditStatus?: 'Unaudited' | 'Reviewed' | 'Audited';
}

// =======================
// STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)
// =======================

export interface BalanceSheetData {
  metadata: StatementMetadata;
  assets: {
    currentAssets: FinancialStatementSection;
    nonCurrentAssets: FinancialStatementSection;
    totalAssets: {
      current: number;
      prior?: number;
      formatted: string;
      formattedPrior?: string;
      variance?: number;
      variancePercent?: number;
      formattedVariance?: string;
    };
  };
  liabilities: {
    currentLiabilities: FinancialStatementSection;
    nonCurrentLiabilities: FinancialStatementSection;
    totalLiabilities: {
      current: number;
      prior?: number;
      formatted: string;
      formattedPrior?: string;
      variance?: number;
      variancePercent?: number;
      formattedVariance?: string;
    };
  };
  equity: {
    sections: FinancialStatementSection[];
    totalEquity: {
      current: number;
      prior?: number;
      formatted: string;
      formattedPrior?: string;
      variance?: number;
      variancePercent?: number;
      formattedVariance?: string;
    };
  };
  balanceCheck: {
    isBalanced: boolean;
    difference: number;
    formattedDifference: string;
  };
}

// =======================
// STATEMENT OF PROFIT OR LOSS
// =======================

export interface ProfitLossData {
  metadata: StatementMetadata;
  revenue: FinancialStatementSection;
  costOfSales: FinancialStatementSection;
  grossProfit: {
    current: number;
    prior?: number;
    formatted: string;
    formattedPrior?: string;
    margin: number;
    priorMargin?: number;
    variance?: number;
    variancePercent?: number;
    formattedVariance?: string;
  };
  operatingExpenses: FinancialStatementSection;
  operatingProfit: {
    current: number;
    prior?: number;
    formatted: string;
    formattedPrior?: string;
    margin: number;
    priorMargin?: number;
    variance?: number;
    variancePercent?: number;
    formattedVariance?: string;
  };
  financeIncome: FinancialStatementSection;
  financeCosts: FinancialStatementSection;
  profitBeforeTax: {
    current: number;
    prior?: number;
    formatted: string;
    formattedPrior?: string;
    margin: number;
    priorMargin?: number;
    variance?: number;
    variancePercent?: number;
    formattedVariance?: string;
  };
  taxExpense: FinancialStatementSection;
  profitForPeriod: {
    current: number;
    prior?: number;
    formatted: string;
    formattedPrior?: string;
    margin: number;
    priorMargin?: number;
    variance?: number;
    variancePercent?: number;
    formattedVariance?: string;
  };
  otherComprehensiveIncome?: FinancialStatementSection;
  totalComprehensiveIncome?: {
    current: number;
    prior?: number;
    formatted: string;
    formattedPrior?: string;
    variance?: number;
    variancePercent?: number;
    formattedVariance?: string;
  };
  earningsPerShare?: {
    basic: number;
    diluted?: number;
    priorBasic?: number;
    priorDiluted?: number;
    formattedBasic: string;
    formattedDiluted?: string;
    formattedPriorBasic?: string;
    formattedPriorDiluted?: string;
  };
}

// =======================
// STATEMENT OF CASH FLOWS
// =======================

export interface CashFlowData {
  metadata: StatementMetadata;
  operatingActivities: {
    method: 'Direct' | 'Indirect';
    items: FinancialStatementItem[];
    netCashFromOperating: {
      current: number;
      prior?: number;
      formatted: string;
      formattedPrior?: string;
      variance?: number;
      variancePercent?: number;
      formattedVariance?: string;
    };
  };
  investingActivities: {
    items: FinancialStatementItem[];
    netCashFromInvesting: {
      current: number;
      prior?: number;
      formatted: string;
      formattedPrior?: string;
      variance?: number;
      variancePercent?: number;
      formattedVariance?: string;
    };
  };
  financingActivities: {
    items: FinancialStatementItem[];
    netCashFromFinancing: {
      current: number;
      prior?: number;
      formatted: string;
      formattedPrior?: string;
      variance?: number;
      variancePercent?: number;
      formattedVariance?: string;
    };
  };
  netIncreaseInCash: {
    current: number;
    prior?: number;
    formatted: string;
    formattedPrior?: string;
    variance?: number;
    variancePercent?: number;
    formattedVariance?: string;
  };
  cashAtBeginning: {
    current: number;
    prior?: number;
    formatted: string;
    formattedPrior?: string;
  };
  cashAtEnd: {
    current: number;
    prior?: number;
    formatted: string;
    formattedPrior?: string;
    variance?: number;
    variancePercent?: number;
    formattedVariance?: string;
  };
  reconciliation?: {
    profitBeforeTax: number;
    adjustments: FinancialStatementItem[];
    workingCapitalChanges: FinancialStatementItem[];
    cashFromOperations: number;
  };
}

// =======================
// STATEMENT OF CHANGES IN EQUITY
// =======================

export interface EquityMovement {
  description: string;
  shareCapital: number;
  shareCapitalFormatted: string;
  retainedEarnings: number;
  retainedEarningsFormatted: string;
  otherComprehensiveIncome: number;
  otherComprehensiveIncomeFormatted: string;
  otherReserves: number;
  otherReservesFormatted: string;
  totalMovement: number;
  totalMovementFormatted: string;
  ifrsReference?: string;
  notes?: string;
}

export interface EquityComponent {
  name: string;
  code: string;
  openingBalance: number;
  openingBalanceFormatted: string;
  movements: EquityMovement[];
  totalMovements: number;
  totalMovementsFormatted: string;
  closingBalance: number;
  closingBalanceFormatted: string;
  priorYearClosing?: number;
  priorYearClosingFormatted?: string;
  variance?: number;
  variancePercent?: number;
  formattedVariance?: string;
}

export interface EquityChangesData {
  metadata: StatementMetadata;
  equityComponents: {
    shareCapital: EquityComponent;
    shareCapitalReserves: EquityComponent;
    retainedEarnings: EquityComponent;
    otherComprehensiveIncome: EquityComponent;
    otherReserves: EquityComponent;
  };
  movements: {
    profitForPeriod: EquityMovement;
    otherComprehensiveIncome: EquityMovement;
    totalComprehensiveIncome: EquityMovement;
    dividendsPaid: EquityMovement;
    shareCapitalIssued: EquityMovement;
    shareCapitalRedemption: EquityMovement;
    shareBasedPayments: EquityMovement;
    transfersToReserves: EquityMovement;
    priorPeriodAdjustments: EquityMovement;
    otherMovements: EquityMovement[];
  };
  totalEquity: {
    openingBalance: number;
    openingBalanceFormatted: string;
    totalMovements: number;
    totalMovementsFormatted: string;
    closingBalance: number;
    closingBalanceFormatted: string;
    priorYearClosing?: number;
    priorYearClosingFormatted?: string;
    variance?: number;
    variancePercent?: number;
    formattedVariance?: string;
  };
  reconciliation: {
    balanceSheetEquityMatches: boolean;
    difference: number;
    formattedDifference: string;
    reconciliationNotes?: string[];
  };
  dividendInformation?: {
    dividendsPerShare: number;
    dividendsPerShareFormatted: string;
    dividendYield?: number;
    dividendCover?: number;
    interimDividends?: number;
    finalDividends?: number;
    specialDividends?: number;
  };
}

// =======================
// FINANCIAL STATEMENTS NOTES
// =======================

export interface FinancialStatementNote {
  id: string;
  noteNumber: string;
  title: string;
  content: string;
  ifrsReference: string;
  statementReferences: string[];
  isRequired: boolean;
  materialityBased: boolean;
  category: NoteCategory;
  subNotes?: FinancialStatementSubNote[];
}

export interface FinancialStatementSubNote {
  id: string;
  title: string;
  content: string;
  tables?: NoteTable[];
  crossReferences?: string[];
}

export interface NoteTable {
  id: string;
  title: string;
  headers: string[];
  rows: NoteTableRow[];
  footnotes?: string[];
}

export interface NoteTableRow {
  id: string;
  cells: (string | number)[];
  isSubtotal?: boolean;
  isTotal?: boolean;
  emphasis?: boolean;
}

export type NoteCategory = 
  | 'AccountingPolicies'
  | 'CriticalEstimates' 
  | 'Revenue'
  | 'Expense'
  | 'Assets'
  | 'Liability'
  | 'Equity'
  | 'CashFlow'
  | 'RiskManagement'
  | 'SegmentReporting'
  | 'RelatedParties'
  | 'Commitments'
  | 'Contingencies'
  | 'SubsequentEvents'
  | 'Other';

export interface NotesConfiguration {
  includeAccountingPolicies: boolean;
  includeEstimatesAndJudgments: boolean;
  includeRiskDisclosures: boolean;
  includeSegmentReporting: boolean;
  includeRelatedPartyTransactions: boolean;
  materialityThreshold: number;
  autoGenerateNotes: boolean;
  noteNumberingStyle: 'numeric' | 'alphabetic' | 'custom';
  groupByStatement: boolean;
}

// =======================
// EXPORT AND PRESENTATION
// =======================

export interface ExportConfiguration {
  format: 'PDF' | 'Excel' | 'CSV' | 'XBRL' | 'JSON';
  template: 'Standard' | 'Detailed' | 'Summary' | 'Regulatory';
  includeNotes: boolean;
  includeComparatives: boolean;
  includeValidation: boolean;
  includeMetadata: boolean;
  coverPage: {
    include: boolean;
    companyLogo?: string;
    customText?: string;
  };
  headerFooter: {
    includeHeader: boolean;
    includeFooter: boolean;
    customHeader?: string;
    customFooter?: string;
    includePageNumbers: boolean;
    includeGenerationDate: boolean;
  };
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    logoPosition?: 'header' | 'cover' | 'both';
  };
}

export interface ValidationConfiguration {
  enableCrossStatementValidation: boolean;
  enableIFRSComplianceChecks: boolean;
  enableMaterialityChecks: boolean;
  enableRatioValidation: boolean;
  customValidationRules: ValidationRule[];
  warningThresholds: {
    materialityPercent: number;
    ratioVariancePercent: number;
    balanceVariancePercent: number;
  };
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  applicableStatements: StatementType[];
  validationFunction: string;
  parameters?: Record<string, any>;
  ifrsReference?: string;
}

// =======================
// CONSOLIDATED TYPES
// =======================

export interface FinancialStatementsPackage {
  metadata: StatementMetadata;
  balanceSheet: BalanceSheetData;
  profitLoss: ProfitLossData;
  cashFlow: CashFlowData;
  notes?: FinancialStatementNote[];
  validationResults: StatementValidationResult[];
}


export interface StatementValidationResult {
  statementType: 'BalanceSheet' | 'ProfitLoss' | 'CashFlow' | 'EquityChanges';
  ruleName: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  lineItem?: string;
  suggestion?: string;
  ifrsReference?: string;
}

// =======================
// PRESENTATION OPTIONS
// =======================

export interface PresentationOptions {
  showComparatives: boolean;
  showVariances: boolean;
  showPercentages: boolean;
  groupByMateriality: boolean;
  roundingUnit: 'units' | 'thousands' | 'millions';
  expandSubtotals: boolean;
  includeNotes: boolean;
  ifrsReferencesVisible: boolean;
}

// =======================
// EXPORT FORMATS
// =======================

export interface ExportOptions {
  format: 'PDF' | 'Excel' | 'CSV' | 'JSON';
  includeMetadata: boolean;
  includeNotes: boolean;
  includeValidation: boolean;
  template?: 'Standard' | 'Detailed' | 'Summary';
  coverPage: boolean;
  headerFooter: boolean;
}

// =======================
// CALCULATION CONTEXTS
// =======================

export interface CalculationContext {
  currentPeriod: StatementPeriod;
  priorPeriod?: StatementPeriod;
  functionalCurrency: string;
  materialityThreshold: number;
  roundingPrecision: number;
  consolidationRequired: boolean;
  ifrsCompliant: boolean;
  auditRequired: boolean;
}

// =======================
// CONSTANTS AND ENUMS
// =======================

export const STATEMENT_TYPES = [
  'BalanceSheet',
  'ProfitLoss', 
  'CashFlow',
  'EquityChanges',
  'ComprehensiveIncome'
] as const;

export type StatementType = typeof STATEMENT_TYPES[number];

export const BALANCE_SHEET_SECTIONS = [
  'Current Assets',
  'Non-Current Assets',
  'Current Liabilities', 
  'Non-Current Liabilities',
  'Equity'
] as const;

export const PROFIT_LOSS_SECTIONS = [
  'Revenue',
  'Cost of Sales',
  'Operating Expenses',
  'Finance Income',
  'Finance Costs',
  'Tax Expense',
  'Other Comprehensive Income'
] as const;

export const CASH_FLOW_SECTIONS = [
  'Operating Activities',
  'Investing Activities', 
  'Financing Activities'
] as const;

// =======================
// IFRS COMPLIANCE RULES
// =======================

export interface IFRSComplianceRule {
  id: string;
  standard: string; // e.g., 'IAS 1'
  title: string;
  description: string;
  applicableStatements: StatementType[];
  mandatory: boolean;
  materialityBased: boolean;
  validationFunction: string;
}

export const IFRS_PRESENTATION_RULES: IFRSComplianceRule[] = [
  {
    id: 'IAS1-P54',
    standard: 'IAS 1',
    title: 'Current/Non-Current Classification',
    description: 'Assets and liabilities must be classified as current or non-current',
    applicableStatements: ['BalanceSheet'],
    mandatory: true,
    materialityBased: false,
    validationFunction: 'validateCurrentNonCurrentClassification'
  },
  {
    id: 'IAS1-P38',
    standard: 'IAS 1',
    title: 'Comparative Information',
    description: 'Comparative information for the preceding period must be presented',
    applicableStatements: ['BalanceSheet', 'ProfitLoss', 'CashFlow'],
    mandatory: true,
    materialityBased: false,
    validationFunction: 'validateComparativeInformation'
  },
  {
    id: 'IAS7-P10',
    standard: 'IAS 7',
    title: 'Cash Flow Classification',
    description: 'Cash flows must be classified into operating, investing, and financing',
    applicableStatements: ['CashFlow'],
    mandatory: true,
    materialityBased: false,
    validationFunction: 'validateCashFlowClassification'
  }
];

// =======================
// UTILITY TYPES
// =======================

export type StatementCalculationResult<T> = {
  data: T;
  validation: StatementValidationResult[];
  metadata: StatementMetadata;
  calculationTime: number;
  warnings: string[];
};

export type PeriodComparison = {
  current: StatementPeriod;
  prior?: StatementPeriod;
  variance: 'increase' | 'decrease' | 'stable';
  isComparable: boolean;
  comparabilityNotes?: string[];
};

// =======================
// FINANCIAL STATEMENTS BUNDLE
// =======================

export interface FinancialStatementsBundleMetadata {
  bundleId: string;
  companyName: string;
  currentPeriod: StatementPeriod;
  priorPeriod?: StatementPeriod;
  generatedAt: string;
  generatedBy: string;
  status: 'draft' | 'review' | 'approved' | 'published' | 'error';
  ifrsCompliant: boolean;
  functionalCurrency: string;
  consolidationScope?: 'standalone' | 'consolidated';
  auditStatus?: 'unaudited' | 'reviewed' | 'audited';
}

export interface FinancialStatementsBundleSummary {
  keyMetrics: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    revenue: number;
    netIncome: number;
    operatingCashFlow: number;
    currentRatio: number;
    debtToEquity: number;
    returnOnAssets: number;
    returnOnEquity: number;
  };
  highlights: Array<{
    metric: string;
    status: 'positive' | 'negative' | 'neutral' | 'warning';
    message: string;
  }>;
}

export interface FinancialStatementsBundle {
  metadata: FinancialStatementsBundleMetadata;
  statements: {
    balanceSheet?: BalanceSheetData;
    profitLoss?: ProfitLossData;
    cashFlow?: CashFlowData;
    statementOfChangesInEquity?: EquityChangesData;
    notes?: FinancialStatementNote[];
  };
  summary: FinancialStatementsBundleSummary;
  validation: StatementValidationResult[];
  exportConfiguration?: ExportConfiguration;
  notesConfiguration?: NotesConfiguration;
}