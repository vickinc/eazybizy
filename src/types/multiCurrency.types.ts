/**
 * Multi-Currency IFRS Types
 * 
 * Types for IFRS-compliant multi-currency accounting including:
 * - IAS 21: The Effects of Changes in Foreign Exchange Rates
 * - Functional vs Presentation Currency
 * - Translation and Remeasurement
 * - Hedging Relationships
 */

export interface CurrencyConfiguration {
  id: string;
  code: string; // ISO 4217 currency code
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
  
  // IFRS specific fields
  isFunctionalCurrency: boolean;
  isPresentationCurrency: boolean;
  translationMethod: TranslationMethod;
  
  // Market data
  currentRate: number;
  lastUpdated: Date;
  source: ExchangeRateSource;
}

export type TranslationMethod = 
  | 'current-rate' // IAS 21.39 - for foreign operations
  | 'temporal' // IAS 21.23 - for foreign currency transactions
  | 'net-investment-hedge'; // IAS 21.32 - for hedged net investments

export type ExchangeRateSource = 
  | 'manual'
  | 'central-bank'
  | 'commercial-provider'
  | 'market-data';

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateType: ExchangeRateType;
  effectiveDate: Date;
  source: ExchangeRateSource;
  isLocked: boolean; // For period closing
  
  // IFRS references
  rateCategory: RateCategory;
  hedgingRelationship?: HedgingRelationship;
}

export type ExchangeRateType = 
  | 'spot' // Current market rate
  | 'forward' // Future contract rate
  | 'average' // Period average rate
  | 'closing' // Period-end rate
  | 'historical'; // Transaction date rate

export type RateCategory = 
  | 'transaction' // IAS 21.21 - for initial recognition
  | 'translation' // IAS 21.39 - for translating foreign operations
  | 'remeasurement' // IAS 21.23 - for monetary items
  | 'hedge'; // For hedging instruments

export interface HedgingRelationship {
  id: string;
  hedgeType: HedgeType;
  hedgedItem: string;
  hedgingInstrument: string;
  effectivenessTest: EffectivenessTest;
  hedgeRatio: number;
  designationDate: Date;
  
  // IFRS 9 hedge accounting
  riskComponent?: string;
  hedgeEffectiveness: number; // Percentage
  ineffectivenessAmount: number;
}

export type HedgeType = 
  | 'fair-value' // IFRS 9.6.2.1
  | 'cash-flow' // IFRS 9.6.5.1
  | 'net-investment'; // IFRS 9.6.5.13

export interface EffectivenessTest {
  method: 'dollar-offset' | 'regression' | 'variance-reduction';
  lastTestDate: Date;
  effectiveness: number;
  threshold: number; // Usually 80-125%
  passed: boolean;
}

export interface MultiCurrencyTransaction {
  id: string;
  originalTransaction: any; // Reference to base transaction
  
  // Currency details
  functionalCurrency: string;
  transactionCurrency: string;
  presentationCurrency: string;
  
  // Original amounts
  originalAmount: number;
  originalCurrency: string;
  
  // Converted amounts
  functionalAmount: number;
  presentationAmount: number;
  
  // Exchange rates used
  transactionRate: ExchangeRate;
  translationRate?: ExchangeRate;
  
  // IFRS tracking
  translationMethod: TranslationMethod;
  translationAdjustment: number;
  cumulativeTranslationAdjustment: number;
  
  // Gains/losses
  realizedGainLoss: number;
  unrealizedGainLoss: number;
  
  metadata: {
    transactionDate: Date;
    recognitionDate: Date;
    lastRevaluationDate?: Date;
    hedgingRelationship?: string;
    ifrsReferences: string[];
  };
}

export interface CurrencyTranslationAdjustment {
  id: string;
  entityId: string;
  period: string;
  
  // Translation components
  assetTranslationAdjustment: number;
  liabilityTranslationAdjustment: number;
  equityTranslationAdjustment: number;
  
  // Cumulative amounts
  cumulativeTranslationAdjustment: number;
  beginningBalance: number;
  periodMovement: number;
  endingBalance: number;
  
  // Disposal/recycling
  recycledToProfit: number;
  recyclingDate?: Date;
  
  // IFRS compliance
  translationMethod: TranslationMethod;
  functionalCurrency: string;
  presentationCurrency: string;
  ifrsReference: string;
}

export interface ForeignCurrencyExposure {
  id: string;
  entityId: string;
  currency: string;
  exposureType: ExposureType;
  
  // Exposure amounts
  grossExposure: number;
  hedgedExposure: number;
  netExposure: number;
  
  // Risk metrics
  valueAtRisk: number;
  sensitivityAnalysis: SensitivityAnalysis[];
  
  // Hedging strategy
  hedgingStrategy?: HedgingStrategy;
  hedgingEffectiveness: number;
  
  // Reporting
  disclosureRequired: boolean;
  disclosureCategory: string;
  lastAssessmentDate: Date;
}

export type ExposureType = 
  | 'transaction' // Committed transactions
  | 'translation' // Net investment in foreign operations
  | 'economic' // Future cash flows
  | 'contingent'; // Contingent considerations

export interface SensitivityAnalysis {
  currencyPair: string;
  shockPercent: number; // e.g., +/-10%
  impactOnProfit: number;
  impactOnOCI: number;
  impactOnEquity: number;
  confidenceLevel: number;
}

export interface HedgingStrategy {
  id: string;
  name: string;
  objective: string;
  instruments: HedgingInstrument[];
  effectivenessTarget: number;
  riskToleranceLevel: 'low' | 'medium' | 'high';
  reviewFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface HedgingInstrument {
  type: 'forward' | 'option' | 'swap' | 'natural-hedge';
  notionalAmount: number;
  currency: string;
  maturityDate: Date;
  fairValue: number;
  hedgeRatio: number;
}

export interface MultiCurrencyFinancialStatement {
  entityId: string;
  statementType: string;
  period: string;
  
  // Currency information
  functionalCurrency: string;
  presentationCurrency: string;
  translationMethod: TranslationMethod;
  
  // Exchange rates summary
  ratesUsed: {
    averageRate: number;
    closingRate: number;
    historicalRates: number[];
  };
  
  // Translation adjustments
  translationAdjustments: CurrencyTranslationAdjustment[];
  totalTranslationAdjustment: number;
  
  // Foreign exchange gains/losses
  realizedFXGainLoss: number;
  unrealizedFXGainLoss: number;
  
  // Hedging results
  hedgingGainLoss: number;
  hedgeIneffectiveness: number;
  
  // Disclosure requirements
  requiredDisclosures: IFRSDisclosure[];
  sensitivityAnalysis: SensitivityAnalysis[];
}

export interface IFRSDisclosure {
  id: string;
  category: DisclosureCategory;
  requirement: string;
  content: string;
  ifrsReference: string;
  isRequired: boolean;
  isMaterial: boolean;
}

export type DisclosureCategory = 
  | 'accounting-policy'
  | 'significant-estimates'
  | 'risk-management'
  | 'sensitivity-analysis'
  | 'hedging-activities'
  | 'foreign-operations';

export interface CurrencyConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  rateType: ExchangeRateType;
  conversionDate: Date;
  translationAdjustment?: number;
  method: TranslationMethod;
}

export interface MultiCurrencyReportingPackage {
  entityId: string;
  consolidationLevel: 'entity' | 'group';
  reportingPeriod: string;
  
  // Currency hierarchy
  functionalCurrency: string;
  reportingCurrency: string;
  localCurrencies: string[];
  
  // Consolidation adjustments
  eliminationEntries: any[];
  translationAdjustments: CurrencyTranslationAdjustment[];
  intercompanyBalances: any[];
  
  // Compliance
  ifrsCompliant: boolean;
  auditTrail: AuditEntry[];
  approvalStatus: ApprovalStatus;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  details: string;
  previousValue?: any;
  newValue?: any;
  ipAddress: string;
}

export type ApprovalStatus = 
  | 'draft'
  | 'pending-review'
  | 'approved'
  | 'rejected'
  | 'locked';