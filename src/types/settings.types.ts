// IFRS Settings Types
export interface IFRSSettings {
  // Accounting Standards
  accountingStandard: AccountingStandard;
  ifrsVersion: string;
  adoptionDate: string;
  
  // Functional Currency
  functionalCurrency: string;
  presentationCurrency: string;
  
  // Materiality & Thresholds
  materialityThreshold: number;
  materialityBasis: MaterialityBasis;
  roundingPrecision: number;
  
  // Reporting Settings
  reportingFrequency: ReportingFrequency;
  consolidationRequired: boolean;
  segmentReportingRequired: boolean;
  
  // Disclosure Settings
  comparativePeriodRequired: boolean;
  interimReportingRequired: boolean;
  cashFlowMethod: CashFlowMethod;
  
  // Audit & Compliance
  externalAuditRequired: boolean;
  auditFirmName?: string;
  complianceOfficer?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type AccountingStandard = 
  | 'IFRS' 
  | 'US GAAP' 
  | 'UK GAAP' 
  | 'Local GAAP' 
  | 'Other';

export type MaterialityBasis = 
  | 'Total Assets'
  | 'Revenue'
  | 'Net Income'
  | 'Equity'
  | 'Custom';

export type ReportingFrequency = 
  | 'Annual'
  | 'Semi-Annual'
  | 'Quarterly'
  | 'Monthly';

export type CashFlowMethod = 
  | 'Direct'
  | 'Indirect';

// Company Profile Settings
export interface CompanySettings {
  // Basic Information
  companyName: string;
  legalName: string;
  registrationNumber: string;
  taxIdentificationNumber: string;
  
  // Contact Information
  address: CompanyAddress;
  contactInfo: ContactInfo;
  
  // Legal Structure
  entityType: EntityType;
  incorporationDate: string;
  incorporationJurisdiction: string;
  
  // Business Information
  industryCode: string;
  businessDescription: string;
  fiscalYearEnd: string;
  
  // Regulatory
  stockExchange?: string;
  tickerSymbol?: string;
  isPublicCompany: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  website?: string;
  fax?: string;
}

export type EntityType = 
  | 'Corporation'
  | 'LLC'
  | 'Partnership'
  | 'Sole Proprietorship'
  | 'Other';

// User Preferences
export interface UserPreferences {
  // Display Settings
  language: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  timezone: string;
  
  // Number Formatting
  numberFormat: NumberFormat;
  currencyDisplay: CurrencyDisplay;
  
  // UI Preferences
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  sidebarCollapsed: boolean;
  
  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  auditAlerts: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type DateFormat = 
  | 'MM/DD/YYYY'
  | 'DD/MM/YYYY'
  | 'YYYY-MM-DD'
  | 'DD.MM.YYYY';

export type TimeFormat = 
  | '12h'
  | '24h';

export interface NumberFormat {
  decimalSeparator: '.' | ',';
  thousandsSeparator: ',' | '.' | ' ' | '';
  negativeFormat: 'parentheses' | 'minus';
}

export type CurrencyDisplay = 
  | 'symbol'
  | 'code'
  | 'name';

// Combined Settings Interface
export interface AppSettings {
  ifrs: IFRSSettings;
  company: CompanySettings;
  user: UserPreferences;
  version: string;
  lastSync?: string;
}

// Settings Validation Rules
export interface SettingsValidationRule {
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// Settings Form Data Interfaces
export interface IFRSSettingsFormData {
  accountingStandard: AccountingStandard;
  ifrsVersion: string;
  adoptionDate: string;
  functionalCurrency: string;
  presentationCurrency: string;
  materialityThreshold: number;
  materialityBasis: MaterialityBasis;
  roundingPrecision: number;
  reportingFrequency: ReportingFrequency;
  consolidationRequired: boolean;
  segmentReportingRequired: boolean;
  comparativePeriodRequired: boolean;
  interimReportingRequired: boolean;
  cashFlowMethod: CashFlowMethod;
  externalAuditRequired: boolean;
  auditFirmName?: string;
  complianceOfficer?: string;
}

export interface CompanySettingsFormData {
  companyName: string;
  legalName: string;
  registrationNumber: string;
  taxIdentificationNumber: string;
  address: CompanyAddress;
  contactInfo: ContactInfo;
  entityType: EntityType;
  incorporationDate: string;
  incorporationJurisdiction: string;
  industryCode: string;
  businessDescription: string;
  fiscalYearEnd: string;
  stockExchange?: string;
  tickerSymbol?: string;
  isPublicCompany: boolean;
}

// Constants
export const ACCOUNTING_STANDARDS: AccountingStandard[] = [
  'IFRS',
  'US GAAP',
  'UK GAAP',
  'Local GAAP',
  'Other'
];

export const MATERIALITY_BASIS_OPTIONS: MaterialityBasis[] = [
  'Total Assets',
  'Revenue',
  'Net Income',
  'Equity',
  'Custom'
];

export const REPORTING_FREQUENCIES: ReportingFrequency[] = [
  'Annual',
  'Semi-Annual',
  'Quarterly',
  'Monthly'
];

export const CASH_FLOW_METHODS: CashFlowMethod[] = [
  'Direct',
  'Indirect'
];

export const ENTITY_TYPES: EntityType[] = [
  'Corporation',
  'LLC',
  'Partnership',
  'Sole Proprietorship',
  'Other'
];

export const DATE_FORMATS: DateFormat[] = [
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'DD.MM.YYYY'
];

export const TIME_FORMATS: TimeFormat[] = [
  '12h',
  '24h'
];

// Default Settings
export const DEFAULT_IFRS_SETTINGS: IFRSSettings = {
  accountingStandard: 'IFRS',
  ifrsVersion: '2023',
  adoptionDate: new Date().toISOString().split('T')[0],
  functionalCurrency: 'USD',
  presentationCurrency: 'USD',
  materialityThreshold: 5,
  materialityBasis: 'Total Assets',
  roundingPrecision: 2,
  reportingFrequency: 'Annual',
  consolidationRequired: false,
  segmentReportingRequired: false,
  comparativePeriodRequired: true,
  interimReportingRequired: false,
  cashFlowMethod: 'Indirect',
  externalAuditRequired: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: '',
  legalName: '',
  registrationNumber: '',
  taxIdentificationNumber: '',
  address: {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  },
  contactInfo: {
    phone: '',
    email: '',
    website: '',
    fax: ''
  },
  entityType: 'Corporation',
  incorporationDate: '',
  incorporationJurisdiction: '',
  industryCode: '',
  businessDescription: '',
  fiscalYearEnd: '12-31',
  isPublicCompany: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  timezone: 'America/New_York',
  numberFormat: {
    decimalSeparator: '.',
    thousandsSeparator: ',',
    negativeFormat: 'minus'
  },
  currencyDisplay: 'symbol',
  theme: 'system',
  compactMode: false,
  sidebarCollapsed: false,
  emailNotifications: true,
  pushNotifications: true,
  auditAlerts: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// IFRS Compliance Rules
export const IFRS_COMPLIANCE_RULES: SettingsValidationRule[] = [
  {
    field: 'functionalCurrency',
    rule: 'FUNCTIONAL_CURRENCY_REQUIRED',
    message: 'Functional currency must be specified for IFRS compliance',
    severity: 'error'
  },
  {
    field: 'materialityThreshold',
    rule: 'MATERIALITY_THRESHOLD_RANGE',
    message: 'Materiality threshold should typically be between 0.5% and 10%',
    severity: 'warning'
  },
  {
    field: 'comparativePeriodRequired',
    rule: 'COMPARATIVE_PERIOD_IFRS',
    message: 'IFRS requires comparative period information',
    severity: 'error'
  },
  {
    field: 'cashFlowMethod',
    rule: 'CASH_FLOW_METHOD_PREFERENCE',
    message: 'IFRS encourages the direct method for cash flow statements',
    severity: 'info'
  }
];