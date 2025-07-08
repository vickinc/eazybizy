export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  category: AccountCategory;
  subcategory?: AccountSubcategory;
  vat: VATType;
  relatedVendor?: string;
  accountType: 'Detail' | 'Header';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  balance?: number;
  classification?: string;
  lastActivity?: string;
  hasTransactions?: boolean;
  transactionCount?: number;
  ifrsReference?: string;
}

export interface ChartOfAccountFormData {
  code: string;
  name: string;
  type: AccountType;
  category: AccountCategory;
  subcategory?: AccountSubcategory;
  vat: VATType;
  relatedVendor: string;
  accountType: 'Detail' | 'Header';
  ifrsReference?: string;
}

export type AccountType = 'Assets' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

// IFRS-compliant subcategories for Balance Sheet classification
export type AccountSubcategory = 
  // Asset Subcategories
  | 'Current Assets'
  | 'Non-Current Assets'
  | 'Property, Plant and Equipment'
  | 'Investment Property'
  | 'Intangible Assets'
  | 'Goodwill'
  | 'Investments in Associates'
  | 'Investments in Joint Ventures'
  | 'Financial Assets'
  | 'Deferred Tax Assets'
  | 'Biological Assets'
  // Liability Subcategories
  | 'Current Liabilities'
  | 'Non-Current Liabilities'
  | 'Financial Liabilities'
  | 'Provisions'
  | 'Deferred Tax Liabilities'
  | 'Employee Benefits'
  | 'Government Grants'
  // Equity Subcategories
  | 'Share Capital'
  | 'Retained Earnings'
  | 'Other Reserves'
  | 'Accumulated Other Comprehensive Income'
  | 'Non-controlling Interests'
  // Revenue Subcategories
  | 'Revenue from Contracts with Customers'
  | 'Other Operating Revenue'
  | 'Investment Income'
  | 'Finance Income'
  | 'Other Comprehensive Income'
  // Expense Subcategories
  | 'Cost of Sales'
  | 'Distribution Costs'
  | 'Administrative Expenses'
  | 'Other Operating Expenses'
  | 'Finance Costs'
  | 'Income Tax Expense';

export type AccountCategory = 
  // Asset Categories
  | 'Cash and cash equivalents'
  | 'Financial investments'
  | 'Trade receivables'
  | 'Receivables from connected parties'
  | 'Tax prepayments and receivables'
  | 'Loan Receivables'
  | 'Other receivables'
  | 'Prepayments for services'
  | 'Raw materials'
  | 'Work in progress'
  | 'Finished goods'
  | 'Purchases'
  | 'Prepayments for inventories'
  | 'Biological assets'
  | 'Shares of subsidiaries'
  | 'Receivables and prepayments'
  | 'Investment property'
  | 'Land'
  | 'Buildings'
  | 'Machinery and equipment'
  | 'Other tangible assets'
  | 'Unfinished construction projects and prepayments'
  | 'Goodwill'
  | 'Development expenditures'
  | 'Computer software'
  | 'Concessions, patents, licences, trademarks'
  | 'Other intangible assets'
  | 'Unfinished projects for intangible assets'
  // Liability Categories  
  | 'Current loans and notes payable'
  | 'Current portion of long-term debts'
  | 'Trade payables'
  | 'Payables to employees'
  | 'Tax payables'
  | 'Other payables'
  | 'Other received prepayments'
  | 'Other provisions'
  | 'Targeted financing'
  | 'Loan liabilities'
  | 'Payables and prepayments'
  | 'Government grants'
  | 'Issued capital'
  | 'Share capital'
  | 'Unregistered equity'
  | 'Share premium'
  | 'Reacquired shares'
  | 'Statutory reserve capital'
  | 'Other reserves'
  | 'Uncalled capital'
  | 'Retained earnings (deficit)'
  | 'Profit (loss) for the year'
  // Revenue Categories
  | 'Revenue'
  | 'Other income'
  | 'Gain (loss) on biological assets'
  | 'Increase/decrease in inventories of finished goods and work in progress'
  | 'Capital expenditure on items of property, plant and equipment for the entity\'s own use'
  | 'Profit (loss) from subsidiaries'
  | 'Profit (loss) from financial investments'
  | 'Other financial income and expense'
  // Expense Categories
  | 'Raw materials and consumables used'
  | 'Other operating expenses'
  | 'Wage and salary expense'
  | 'Social security taxes'
  | 'Depreciation and impairment loss (reversal)'
  | 'Other expense'
  | 'Interest expenses'
  | 'Income tax expense';

// VAT Type is now dynamic - can be any string representing a VAT treatment
export type VATType = string;

export interface ChartOfAccountsStats {
  total: number;
  byType: {
    [key in AccountType]: number;
  };
  byVAT: {
    [key: string]: number;
  };
}

export interface ChartOfAccountsFilter {
  search: string;
  type: AccountType | 'all';
  category: AccountCategory | 'all';
  subcategory: AccountSubcategory | 'all';
  vat: VATType | 'all';
  accountType: 'Detail' | 'Header' | 'all';
  isActive: boolean | 'all';
  ifrsReference: string | 'all';
}

export const ACCOUNT_TYPES: AccountType[] = ['Assets', 'Liability', 'Equity', 'Revenue', 'Expense'];

export const ACCOUNT_SUBCATEGORIES: AccountSubcategory[] = [
  // Asset Subcategories
  'Current Assets',
  'Non-Current Assets',
  'Property, Plant and Equipment',
  'Investment Property',
  'Intangible Assets',
  'Goodwill',
  'Investments in Associates',
  'Investments in Joint Ventures',
  'Financial Assets',
  'Deferred Tax Assets',
  'Biological Assets',
  // Liability Subcategories
  'Current Liabilities',
  'Non-Current Liabilities',
  'Financial Liabilities',
  'Provisions',
  'Deferred Tax Liabilities',
  'Employee Benefits',
  'Government Grants',
  // Equity Subcategories
  'Share Capital',
  'Retained Earnings',
  'Other Reserves',
  'Accumulated Other Comprehensive Income',
  'Non-controlling Interests',
  // Revenue Subcategories
  'Revenue from Contracts with Customers',
  'Other Operating Revenue',
  'Investment Income',
  'Finance Income',
  'Other Comprehensive Income',
  // Expense Subcategories
  'Cost of Sales',
  'Distribution Costs',
  'Administrative Expenses',
  'Other Operating Expenses',
  'Finance Costs',
  'Income Tax Expense'
];

export const ACCOUNT_CATEGORIES: AccountCategory[] = [
  // Asset Categories
  'Cash and cash equivalents',
  'Financial investments',
  'Trade receivables',
  'Receivables from connected parties',
  'Tax prepayments and receivables',
  'Loan Receivables',
  'Other receivables',
  'Prepayments for services',
  'Raw materials',
  'Work in progress',
  'Finished goods',
  'Purchases',
  'Prepayments for inventories',
  'Biological assets',
  'Shares of subsidiaries',
  'Receivables and prepayments',
  'Investment property',
  'Land',
  'Buildings',
  'Machinery and equipment',
  'Other tangible assets',
  'Unfinished construction projects and prepayments',
  'Goodwill',
  'Development expenditures',
  'Computer software',
  'Concessions, patents, licences, trademarks',
  'Other intangible assets',
  'Unfinished projects for intangible assets',
  // Liability Categories
  'Current loans and notes payable',
  'Current portion of long-term debts',
  'Trade payables',
  'Payables to employees',
  'Tax payables',
  'Other payables',
  'Other received prepayments',
  'Other provisions',
  'Targeted financing',
  'Loan liabilities',
  'Payables and prepayments',
  'Government grants',
  'Issued capital',
  'Share capital',
  'Unregistered equity',
  'Share premium',
  'Reacquired shares',
  'Statutory reserve capital',
  'Other reserves',
  'Uncalled capital',
  'Retained earnings (deficit)',
  'Profit (loss) for the year',
  // Revenue Categories
  'Revenue',
  'Other income',
  'Gain (loss) on biological assets',
  'Increase/decrease in inventories of finished goods and work in progress',
  'Capital expenditure on items of property, plant and equipment for the entity\'s own use',
  'Profit (loss) from subsidiaries',
  'Profit (loss) from financial investments',
  'Other financial income and expense',
  // Expense Categories
  'Raw materials and consumables used',
  'Other operating expenses',
  'Wage and salary expense',
  'Social security taxes',
  'Depreciation and impairment loss (reversal)',
  'Other expense',
  'Interest expenses',
  'Income tax expense'
];

export const ACCOUNT_CATEGORIES_BY_TYPE: Record<AccountType, AccountCategory[]> = {
  'Assets': [
    'Cash and cash equivalents',
    'Financial investments', 
    'Trade receivables',
    'Receivables from connected parties',
    'Tax prepayments and receivables',
    'Loan Receivables',
    'Other receivables',
    'Prepayments for services',
    'Raw materials',
    'Work in progress',
    'Finished goods',
    'Purchases',
    'Prepayments for inventories',
    'Biological assets',
    'Shares of subsidiaries',
    'Receivables and prepayments',
    'Investment property',
    'Land',
    'Buildings',
    'Machinery and equipment',
    'Other tangible assets',
    'Unfinished construction projects and prepayments',
    'Goodwill',
    'Development expenditures',
    'Computer software',
    'Concessions, patents, licences, trademarks',
    'Other intangible assets',
    'Unfinished projects for intangible assets'
  ],
  'Liability': [
    'Current loans and notes payable',
    'Current portion of long-term debts',
    'Trade payables',
    'Payables to employees',
    'Tax payables',
    'Other payables',
    'Other received prepayments',
    'Other provisions',
    'Targeted financing',
    'Loan liabilities',
    'Payables and prepayments',
    'Government grants'
  ],
  'Equity': [
    'Issued capital',
    'Share capital',
    'Unregistered equity',
    'Share premium',
    'Reacquired shares',
    'Statutory reserve capital',
    'Other reserves',
    'Uncalled capital',
    'Retained earnings (deficit)',
    'Profit (loss) for the year'
  ],
  'Revenue': [
    'Revenue',
    'Other income',
    'Gain (loss) on biological assets',
    'Increase/decrease in inventories of finished goods and work in progress',
    'Capital expenditure on items of property, plant and equipment for the entity\'s own use',
    'Profit (loss) from subsidiaries',
    'Profit (loss) from financial investments',
    'Other financial income and expense'
  ],
  'Expense': [
    'Raw materials and consumables used',
    'Other operating expenses',
    'Wage and salary expense',
    'Social security taxes',
    'Depreciation and impairment loss (reversal)',
    'Other expense',
    'Interest expenses',
    'Income tax expense'
  ]
};

// VAT_TYPES is now provided dynamically by VATTypesIntegrationService
// This allows for both static and custom VAT treatments to be available

export const ACCOUNT_TYPE_DESCRIPTIONS = {
  'Assets': 'Resources owned by the company (cash, inventory, equipment)',
  'Liability': 'Obligations and debts owed by the company',
  'Equity': 'Owner\'s equity and retained earnings',
  'Revenue': 'Income generated from business operations',
  'Expense': 'Costs incurred in business operations'
} as const;

export const ACCOUNT_CLASSIFICATIONS = {
  'Assets': ['Current Assets', 'Fixed Assets', 'Intangible Assets', 'Investments'],
  'Liability': ['Current Liabilities', 'Long-term Liabilities'],
  'Equity': ['Share Capital', 'Retained Earnings', 'Other Equity'],
  'Revenue': ['Operating Revenue', 'Non-operating Revenue', 'Other Income'],
  'Expense': ['Cost of Goods Sold', 'Operating Expenses', 'Administrative Expenses', 'Financial Expenses']
} as const;

// IFRS-compliant subcategories mapping by account type
export const ACCOUNT_SUBCATEGORIES_BY_TYPE: Record<AccountType, AccountSubcategory[]> = {
  'Assets': [
    'Current Assets',
    'Non-Current Assets',
    'Property, Plant and Equipment',
    'Investment Property',
    'Intangible Assets',
    'Goodwill',
    'Investments in Associates',
    'Investments in Joint Ventures',
    'Financial Assets',
    'Deferred Tax Assets',
    'Biological Assets'
  ],
  'Liability': [
    'Current Liabilities',
    'Non-Current Liabilities',
    'Financial Liabilities',
    'Provisions',
    'Deferred Tax Liabilities',
    'Employee Benefits',
    'Government Grants'
  ],
  'Equity': [
    'Share Capital',
    'Retained Earnings',
    'Other Reserves',
    'Accumulated Other Comprehensive Income',
    'Non-controlling Interests'
  ],
  'Revenue': [
    'Revenue from Contracts with Customers',
    'Other Operating Revenue',
    'Investment Income',
    'Finance Income',
    'Other Comprehensive Income'
  ],
  'Expense': [
    'Cost of Sales',
    'Distribution Costs',
    'Administrative Expenses',
    'Other Operating Expenses',
    'Finance Costs',
    'Income Tax Expense'
  ]
};

// IFRS standards references for guidance
export const IFRS_REFERENCES = {
  'IAS 1': 'Presentation of Financial Statements',
  'IAS 2': 'Inventories',
  'IAS 7': 'Statement of Cash Flows',
  'IAS 8': 'Accounting Policies, Changes in Accounting Estimates and Errors',
  'IAS 12': 'Income Taxes',
  'IAS 16': 'Property, Plant and Equipment',
  'IAS 19': 'Employee Benefits',
  'IAS 23': 'Borrowing Costs',
  'IAS 24': 'Related Party Disclosures',
  'IAS 32': 'Financial Instruments: Presentation',
  'IAS 36': 'Impairment of Assets',
  'IAS 37': 'Provisions, Contingent Liabilities and Contingent Assets',
  'IAS 38': 'Intangible Assets',
  'IAS 40': 'Investment Property',
  'IAS 41': 'Agriculture',
  'IFRS 3': 'Business Combinations',
  'IFRS 5': 'Non-current Assets Held for Sale and Discontinued Operations',
  'IFRS 7': 'Financial Instruments: Disclosures',
  'IFRS 9': 'Financial Instruments',
  'IFRS 10': 'Consolidated Financial Statements',
  'IFRS 11': 'Joint Arrangements',
  'IFRS 12': 'Disclosure of Interests in Other Entities',
  'IFRS 13': 'Fair Value Measurement',
  'IFRS 15': 'Revenue from Contracts with Customers',
  'IFRS 16': 'Leases'
} as const;

export interface AccountGroup {
  type: AccountType;
  accounts: ChartOfAccount[];
  totalBalance: number;
  count: number;
}

export interface ChartOfAccountsTableSortConfig {
  field: 'code' | 'name' | 'type' | 'category' | 'subcategory' | 'balance' | 'classification' | 'ifrsReference';
  direction: 'asc' | 'desc';
}