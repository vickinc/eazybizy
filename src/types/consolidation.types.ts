/**
 * Consolidation Framework Types
 * 
 * IFRS-compliant consolidation types implementing:
 * - IFRS 10: Consolidated Financial Statements
 * - IFRS 11: Joint Arrangements
 * - IAS 28: Investments in Associates and Joint Ventures
 * - IFRS 12: Disclosure of Interests in Other Entities
 */

export interface ConsolidationGroup {
  id: string;
  name: string;
  parentEntityId: string;
  reportingCurrency: string;
  reportingPeriod: string;
  
  // Group structure
  entities: ConsolidationEntity[];
  relationships: EntityRelationship[];
  
  // Consolidation settings
  consolidationMethod: ConsolidationMethod;
  controlAssessment: ControlAssessment;
  materiality: MaterialityThresholds;
  
  // Elimination entries
  eliminationEntries: EliminationEntry[];
  adjustmentEntries: ConsolidationAdjustment[];
  
  // Status and controls
  status: ConsolidationStatus;
  approvals: ConsolidationApproval[];
  auditTrail: ConsolidationAuditEntry[];
  
  // IFRS compliance
  ifrsCompliant: boolean;
  disclosureRequirements: ConsolidationDisclosure[];
}

export interface ConsolidationEntity {
  id: string;
  entityId: string;
  entityName: string;
  entityType: EntityType;
  
  // Ownership and control
  ownershipPercentage: number;
  votingRights: number;
  controlPercentage: number;
  
  // Currency and reporting
  functionalCurrency: string;
  reportingCurrency: string;
  reportingFrequency: ReportingFrequency;
  
  // Classification
  consolidationTreatment: ConsolidationTreatment;
  consolidationMethod: ConsolidationMethod;
  
  // Financial data
  financialStatements: EntityFinancialStatements;
  adjustments: EntityAdjustment[];
  translations: CurrencyTranslation[];
  
  // Dates and timing
  acquisitionDate?: Date;
  disposalDate?: Date;
  reportingDate: Date;
  
  // IFRS specific
  ifrsCompliance: IFRSComplianceStatus;
  materialityAssessment: MaterialityAssessment;
}

export type EntityType = 
  | 'subsidiary'
  | 'associate'
  | 'joint-venture'
  | 'joint-operation'
  | 'branch'
  | 'special-purpose-entity';

export type ConsolidationTreatment = 
  | 'full-consolidation' // IFRS 10 - subsidiaries
  | 'equity-method' // IAS 28 - associates and joint ventures
  | 'proportionate-consolidation' // IFRS 11 - joint operations
  | 'cost-method' // Non-significant investments
  | 'fair-value' // IFRS 9 - financial instruments
  | 'excluded'; // Out of scope

export type ConsolidationMethod = 
  | 'acquisition-method' // IFRS 3
  | 'pooling-of-interests' // Rare circumstances
  | 'proportionate' // Joint arrangements
  | 'equity-accounting'; // Associates

export interface ControlAssessment {
  id: string;
  entityId: string;
  assessmentDate: Date;
  
  // Control indicators (IFRS 10.7)
  hasControllingVotes: boolean;
  controlsBoard: boolean;
  hasDecisionMakingRights: boolean;
  hasVetoRights: boolean;
  
  // Power assessment (IFRS 10.10)
  hasPower: boolean;
  powerSource: PowerSource;
  powerEvidence: string[];
  
  // Variable returns (IFRS 10.15)
  hasVariableReturns: boolean;
  returnTypes: ReturnType[];
  exposureToVariability: number;
  
  // Link between power and returns (IFRS 10.17)
  canUseReturns: boolean;
  linkEvidence: string[];
  
  // Conclusion
  hasControl: boolean;
  controlConclusion: string;
  controlDate: Date;
  
  // Agency considerations (IFRS 10.58)
  isAgent: boolean;
  agentEvidence?: string[];
}

export type PowerSource = 
  | 'voting-rights'
  | 'contractual-arrangements'
  | 'board-representation'
  | 'special-rights'
  | 'de-facto-control';

export type ReturnType = 
  | 'dividends'
  | 'interest'
  | 'management-fees'
  | 'synergies'
  | 'tax-benefits'
  | 'guarantees';

export interface EntityRelationship {
  id: string;
  parentEntityId: string;
  childEntityId: string;
  relationshipType: RelationshipType;
  
  // Ownership details
  ownershipPercentage: number;
  votingPercentage: number;
  acquisitionDate: Date;
  acquisitionCost: number;
  
  // Control details
  controlLevel: ControlLevel;
  controlMethod: ControlMethod;
  
  // Investment classification
  investmentType: InvestmentType;
  significantInfluence: boolean;
  
  // Changes during period
  ownershipChanges: OwnershipChange[];
  controlChanges: ControlChange[];
}

export type RelationshipType = 
  | 'parent-subsidiary'
  | 'investor-associate'
  | 'joint-venturer'
  | 'joint-operator'
  | 'investment';

export type ControlLevel = 
  | 'full-control' // > 50% or de facto control
  | 'significant-influence' // 20-50% typically
  | 'joint-control' // Shared control
  | 'no-control'; // < 20% typically

export type ControlMethod = 
  | 'voting-control'
  | 'contractual-control'
  | 'board-control'
  | 'de-facto-control';

export type InvestmentType = 
  | 'strategic'
  | 'financial'
  | 'temporary'
  | 'held-for-sale';

export interface EliminationEntry {
  id: string;
  eliminationType: EliminationType;
  description: string;
  
  // Accounting details
  debitAccount: string;
  creditAccount: string;
  amount: number;
  currency: string;
  
  // Entities involved
  eliminationScope: string[]; // Entity IDs
  
  // Supporting documentation
  supportingDocuments: string[];
  calculationMethod: string;
  
  // Review and approval
  preparedBy: string;
  reviewedBy: string;
  approvedBy: string;
  
  // IFRS reference
  ifrsReference: string;
  consolidationStep: ConsolidationStep;
}

export type EliminationType = 
  | 'intercompany-transactions'
  | 'intercompany-balances'
  | 'investment-elimination'
  | 'goodwill-calculation'
  | 'non-controlling-interests'
  | 'unrealized-profits'
  | 'dividend-elimination'
  | 'fair-value-adjustments';

export type ConsolidationStep = 
  | 'pre-consolidation'
  | 'translation'
  | 'elimination'
  | 'non-controlling'
  | 'final-adjustments';

export interface ConsolidationAdjustment {
  id: string;
  adjustmentType: AdjustmentType;
  description: string;
  
  // Financial impact
  accountAffected: string;
  adjustmentAmount: number;
  currency: string;
  
  // Entities affected
  entitiesAffected: string[];
  
  // Timing and frequency
  adjustmentDate: Date;
  isRecurring: boolean;
  frequency?: AdjustmentFrequency;
  
  // Business combination specific
  isBusinessCombination: boolean;
  acquisitionDate?: Date;
  fairValueAdjustment?: FairValueAdjustment;
  
  // IFRS compliance
  ifrsReference: string;
  complianceNotes: string;
}

export type AdjustmentType = 
  | 'fair-value-measurement'
  | 'purchase-price-allocation'
  | 'goodwill-impairment'
  | 'depreciation-alignment'
  | 'tax-harmonization'
  | 'accounting-policy-alignment'
  | 'timing-differences'
  | 'currency-translation';

export type AdjustmentFrequency = 
  | 'one-time'
  | 'monthly'
  | 'quarterly'
  | 'annually';

export interface FairValueAdjustment {
  assetType: string;
  bookValue: number;
  fairValue: number;
  adjustmentAmount: number;
  valuationMethod: ValuationMethod;
  valuationDate: Date;
  usefulLife?: number;
  depreciationMethod?: string;
}

export type ValuationMethod = 
  | 'market-approach'
  | 'income-approach'
  | 'cost-approach'
  | 'discounted-cash-flow'
  | 'comparable-transactions';

export interface ConsolidatedFinancialStatements {
  groupId: string;
  period: string;
  currency: string;
  
  // Consolidated statements
  consolidatedBalanceSheet: ConsolidatedBalanceSheet;
  consolidatedIncomeStatement: ConsolidatedIncomeStatement;
  consolidatedCashFlow: ConsolidatedCashFlow;
  consolidatedEquity: ConsolidatedEquity;
  
  // Segment information (IFRS 8)
  segmentReporting: SegmentInformation;
  
  // Non-controlling interests
  nonControllingInterests: NonControllingInterest[];
  
  // Business combinations (IFRS 3)
  businessCombinations: BusinessCombination[];
  
  // Eliminations summary
  eliminationsSummary: EliminationSummary;
  
  // Disclosures (IFRS 12)
  structuredDisclosures: StructuredEntityDisclosure[];
  
  // Validation and controls
  validationResults: ConsolidationValidation[];
  materialityAssessment: GroupMaterialityAssessment;
}

export interface NonControllingInterest {
  entityId: string;
  entityName: string;
  ownershipPercentage: number;
  
  // Financial impact
  shareOfAssets: number;
  shareOfLiabilities: number;
  shareOfEquity: number;
  shareOfProfit: number;
  shareOfOCI: number;
  
  // Dividends
  dividendsReceived: number;
  dividendsPaid: number;
  
  // Changes during period
  beginningBalance: number;
  acquisitions: number;
  disposals: number;
  profitAllocation: number;
  ociAllocation: number;
  endingBalance: number;
}

export interface BusinessCombination {
  id: string;
  acquirerEntityId: string;
  acquireeEntityId: string;
  acquisitionDate: Date;
  
  // Purchase consideration
  purchaseConsideration: PurchaseConsideration;
  
  // Fair value allocations
  identifiableAssets: FairValueAdjustment[];
  identifiableLiabilities: FairValueAdjustment[];
  
  // Goodwill calculation
  goodwill: GoodwillCalculation;
  
  // Non-controlling interests
  nonControllingInterestMeasurement: NonControllingInterestMeasurement;
  
  // Performance since acquisition
  revenueContribution: number;
  profitContribution: number;
  
  // Pro forma information
  proFormaRevenue: number;
  proFormaProfit: number;
  
  // IFRS 3 disclosures
  ifrs3Disclosures: IFRS3Disclosure[];
}

export interface PurchaseConsideration {
  cashPaid: number;
  sharesIssued: number;
  shareValue: number;
  contingentConsideration: number;
  totalConsideration: number;
  
  // Transaction costs
  transactionCosts: number;
  
  // Settlement of pre-existing relationships
  settlementAmounts: number;
}

export interface GoodwillCalculation {
  purchaseConsideration: number;
  nonControllingInterest: number;
  identifiableNetAssets: number;
  goodwill: number;
  
  // Subsequent measurement
  impairmentTesting: GoodwillImpairmentTest[];
  cumulativeImpairment: number;
  carryingAmount: number;
}

export interface MaterialityThresholds {
  groupMateriality: number;
  entityMaterialityPercentage: number;
  eliminationMateriality: number;
  adjustmentMateriality: number;
  disclosureMateriality: number;
  
  // Basis for materiality
  materialityBasis: MaterialityBasis;
  materialityCalculation: string;
}

export type MaterialityBasis = 
  | 'group-revenue'
  | 'group-profit'
  | 'group-assets'
  | 'group-equity'
  | 'mixed-approach';

export type ConsolidationStatus = 
  | 'in-progress'
  | 'completed'
  | 'under-review'
  | 'approved'
  | 'rejected'
  | 'locked';

export type ReportingFrequency = 
  | 'monthly'
  | 'quarterly'
  | 'semi-annually'
  | 'annually';

// Additional interfaces for supporting structures
export interface EntityFinancialStatements {
  balanceSheet: any;
  incomeStatement: any;
  cashFlowStatement: any;
  equityStatement: any;
  notes: any[];
}

export interface EntityAdjustment {
  id: string;
  type: string;
  amount: number;
  description: string;
  ifrsReference: string;
}

export interface CurrencyTranslation {
  fromCurrency: string;
  toCurrency: string;
  method: string;
  rate: number;
  adjustment: number;
}

export interface IFRSComplianceStatus {
  isCompliant: boolean;
  complianceDate: Date;
  complianceNotes: string[];
  exceptions: string[];
}

export interface MaterialityAssessment {
  threshold: number;
  isMaterial: boolean;
  assessmentDate: Date;
  assessmentNotes: string;
}

export interface OwnershipChange {
  changeDate: Date;
  previousPercentage: number;
  newPercentage: number;
  changeReason: string;
}

export interface ControlChange {
  changeDate: Date;
  previousControl: boolean;
  newControl: boolean;
  changeReason: string;
}

export interface ConsolidationApproval {
  level: string;
  approver: string;
  approvalDate: Date;
  status: string;
  comments: string;
}

export interface ConsolidationAuditEntry {
  timestamp: Date;
  userId: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface ConsolidationDisclosure {
  type: string;
  requirement: string;
  content: string;
  ifrsReference: string;
}

export interface ConsolidatedBalanceSheet {
  assets: any;
  liabilities: any;
  equity: any;
  nonControllingInterests: number;
}

export interface ConsolidatedIncomeStatement {
  revenue: any;
  expenses: any;
  profitBeforeTax: number;
  profitAfterTax: number;
  profitAttributableToParent: number;
  profitAttributableToNCI: number;
}

export interface ConsolidatedCashFlow {
  operatingActivities: any;
  investingActivities: any;
  financingActivities: any;
  netCashFlow: number;
}

export interface ConsolidatedEquity {
  shareCapital: number;
  retainedEarnings: number;
  otherReserves: number;
  parentEquity: number;
  nonControllingInterests: number;
  totalEquity: number;
}

export interface SegmentInformation {
  segments: BusinessSegment[];
  reconciliations: SegmentReconciliation[];
}

export interface BusinessSegment {
  name: string;
  revenue: number;
  profit: number;
  assets: number;
  liabilities: number;
}

export interface SegmentReconciliation {
  item: string;
  segmentTotal: number;
  consolidatedTotal: number;
  reconciliationItems: ReconciliationItem[];
}

export interface ReconciliationItem {
  description: string;
  amount: number;
}

export interface EliminationSummary {
  totalEliminations: number;
  byCategory: { [key: string]: number };
  materialEliminations: EliminationEntry[];
}

export interface StructuredEntityDisclosure {
  entityType: string;
  purpose: string;
  activities: string;
  financing: string;
  exposure: number;
  support: string;
}

export interface ConsolidationValidation {
  rule: string;
  status: string;
  message: string;
  severity: string;
}

export interface GroupMaterialityAssessment {
  overallMateriality: number;
  performanceMateriality: number;
  clearlyTrivialThreshold: number;
  entityMateriality: { [entityId: string]: number };
}

export interface GoodwillImpairmentTest {
  testDate: Date;
  cashGeneratingUnit: string;
  carryingAmount: number;
  recoverableAmount: number;
  impairmentLoss: number;
  method: string;
}

export interface NonControllingInterestMeasurement {
  method: 'fair-value' | 'proportionate-share';
  amount: number;
  basis: string;
}

export interface IFRS3Disclosure {
  category: string;
  requirement: string;
  content: string;
  ifrsReference: string;
}