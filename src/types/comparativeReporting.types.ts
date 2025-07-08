/**
 * Comparative Reporting Types
 * 
 * Types for IFRS-compliant comparative reporting including:
 * - IAS 1.38: Comparative information requirements
 * - Multi-period financial statement analysis
 * - Trend analysis and variance reporting
 * - Restated comparative figures
 * - Prior period adjustments and changes in accounting policies
 */

export interface ComparativeReport {
  id: string;
  reportType: ComparativeReportType;
  title: string;
  
  // Reporting periods
  currentPeriod: ReportingPeriod;
  comparativePeriods: ReportingPeriod[];
  
  // Report configuration
  configuration: ComparativeReportConfiguration;
  
  // Financial data
  statements: ComparativeFinancialStatements;
  
  // Analysis and insights
  varianceAnalysis: VarianceAnalysis;
  trendAnalysis: TrendAnalysis;
  ratioAnalysis: RatioAnalysis;
  
  // IFRS compliance
  ifrsCompliant: boolean;
  comparativeAdjustments: ComparativeAdjustment[];
  restatements: Restatement[];
  
  // Narrative and commentary
  managementCommentary: ManagementCommentary;
  keyInsights: KeyInsight[];
  
  // Validation and quality
  validationResults: ComparativeValidationResult[];
  dataQualityScore: number;
  
  // Metadata
  generatedBy: string;
  generatedDate: Date;
  approvalStatus: ApprovalStatus;
  distributionList: string[];
}

export type ComparativeReportType = 
  | 'financial-statements' // Standard comparative financial statements
  | 'management-accounts' // Internal management reporting
  | 'quarterly-comparison' // Quarter-over-quarter analysis
  | 'annual-comparison' // Year-over-year analysis
  | 'budget-vs-actual' // Budget variance analysis
  | 'forecast-vs-actual' // Forecast variance analysis
  | 'segment-comparison' // Segment performance comparison
  | 'peer-benchmarking' // Industry/peer comparison
  | 'kpi-dashboard' // Key performance indicators tracking
  | 'regulatory-filing'; // Regulatory comparative reporting

export interface ReportingPeriod {
  id: string;
  periodType: PeriodType;
  startDate: Date;
  endDate: Date;
  periodName: string;
  fiscalYear: number;
  
  // Period characteristics
  isPrimary: boolean; // Current/main period
  isComparative: boolean; // Comparative period
  isRestated: boolean; // Has been restated
  
  // Data availability
  dataCompleteness: number; // Percentage
  dataQuality: DataQualityStatus;
  adjustments: PeriodAdjustment[];
  
  // Contextual information
  businessContext: BusinessContext;
  economicContext: EconomicContext;
}

export type PeriodType = 
  | 'monthly'
  | 'quarterly'
  | 'semi-annually'
  | 'annually'
  | 'ytd' // Year-to-date
  | 'rolling-12'; // Rolling 12 months

export type DataQualityStatus = 
  | 'high'
  | 'medium'
  | 'low'
  | 'incomplete'
  | 'provisional'
  | 'audited';

export interface PeriodAdjustment {
  id: string;
  adjustmentType: AdjustmentType;
  description: string;
  amount: number;
  reason: string;
  ifrsReference?: string;
  affectedStatements: string[];
  documentedBy: string;
  documentedDate: Date;
}

export type AdjustmentType = 
  | 'prior-period-error' // IAS 8.42
  | 'change-in-policy' // IAS 8.19
  | 'change-in-estimate' // IAS 8.36
  | 'reclassification' // IAS 1.41
  | 'correction'
  | 'restatement'
  | 'cut-off-adjustment';

export interface BusinessContext {
  majorEvents: BusinessEvent[];
  seasonalFactors: SeasonalFactor[];
  operationalChanges: OperationalChange[];
  acquisitionsDisposals: AcquisitionDisposal[];
}

export interface BusinessEvent {
  eventType: BusinessEventType;
  description: string;
  eventDate: Date;
  estimatedImpact: number;
  impactCategories: string[];
}

export type BusinessEventType = 
  | 'acquisition'
  | 'disposal'
  | 'restructuring'
  | 'new-product-launch'
  | 'market-expansion'
  | 'regulatory-change'
  | 'natural-disaster'
  | 'pandemic-impact'
  | 'technology-upgrade';

export interface SeasonalFactor {
  factor: string;
  description: string;
  typicalImpact: number; // Percentage
  affectedMetrics: string[];
}

export interface OperationalChange {
  changeType: string;
  description: string;
  implementationDate: Date;
  expectedBenefit: number;
  actualBenefit?: number;
}

export interface AcquisitionDisposal {
  type: 'acquisition' | 'disposal';
  entityName: string;
  transactionDate: Date;
  transactionValue: number;
  contributionToResults: number;
  integrationStatus?: string;
}

export interface EconomicContext {
  gdpGrowthRate: number;
  inflationRate: number;
  interestRates: InterestRateInfo;
  exchangeRates: ExchangeRateInfo[];
  industryBenchmarks: IndustryBenchmark[];
}

export interface InterestRateInfo {
  centralBankRate: number;
  corporateBondYield: number;
  riskFreeRate: number;
  companyBorrowingRate?: number;
}

export interface ExchangeRateInfo {
  currencyPair: string;
  averageRate: number;
  endingRate: number;
  volatility: number;
}

export interface IndustryBenchmark {
  metric: string;
  industryAverage: number;
  industryMedian: number;
  topQuartile: number;
  companyPosition?: number;
}

export interface ComparativeReportConfiguration {
  // Reporting preferences
  showVariances: boolean;
  showPercentageChanges: boolean;
  showTrends: boolean;
  includeGraphics: boolean;
  includeCommentary: boolean;
  
  // Analysis options
  calculateRatios: boolean;
  performBenchmarking: boolean;
  highlightAnomalies: boolean;
  
  // Display options
  currencyFormat: CurrencyFormat;
  roundingLevel: RoundingLevel;
  sortingPreference: SortingPreference;
  
  // Filtering and grouping
  accountGrouping: AccountGrouping;
  materialityThreshold: number;
  excludeImmaterialItems: boolean;
  
  // Visualization
  chartTypes: ChartType[];
  colorScheme: ColorScheme;
  
  // Compliance
  ifrsPresentation: boolean;
  includeNotes: boolean;
  auditTrailVisible: boolean;
}

export type CurrencyFormat = 
  | 'full-amount'
  | 'thousands'
  | 'millions'
  | 'auto-scale';

export type RoundingLevel = 
  | 'exact'
  | 'nearest-dollar'
  | 'nearest-hundred'
  | 'nearest-thousand';

export type SortingPreference = 
  | 'alphabetical'
  | 'magnitude'
  | 'variance'
  | 'materiality'
  | 'custom';

export type AccountGrouping = 
  | 'none'
  | 'account-type'
  | 'statement-section'
  | 'business-unit'
  | 'cost-center'
  | 'custom';

export type ChartType = 
  | 'line-chart'
  | 'bar-chart'
  | 'waterfall-chart'
  | 'pie-chart'
  | 'trend-chart'
  | 'variance-chart';

export type ColorScheme = 
  | 'professional'
  | 'corporate'
  | 'high-contrast'
  | 'colorblind-friendly'
  | 'custom';

export interface ComparativeFinancialStatements {
  balanceSheet: ComparativeBalanceSheet;
  profitLoss: ComparativeProfitLoss;
  cashFlow: ComparativeCashFlow;
  equityChanges: ComparativeEquityChanges;
  
  // Consolidated if applicable
  consolidated?: ConsolidatedComparative;
  
  // Segment reporting if applicable
  segments?: SegmentComparative[];
}

export interface ComparativeBalanceSheet {
  assets: ComparativeLineItemGroup;
  liabilities: ComparativeLineItemGroup;
  equity: ComparativeLineItemGroup;
  
  // Summary metrics
  totalAssets: ComparativeLineItem;
  totalLiabilities: ComparativeLineItem;
  totalEquity: ComparativeLineItem;
  
  // Validation
  balanceCheck: BalanceValidation;
}

export interface ComparativeProfitLoss {
  revenue: ComparativeLineItemGroup;
  expenses: ComparativeLineItemGroup;
  
  // Key metrics
  grossProfit: ComparativeLineItem;
  operatingProfit: ComparativeLineItem;
  netIncome: ComparativeLineItem;
  
  // Per share data
  earningsPerShare: ComparativeLineItem;
  dividendsPerShare: ComparativeLineItem;
  
  // Margins
  grossMargin: ComparativeLineItem;
  operatingMargin: ComparativeLineItem;
  netMargin: ComparativeLineItem;
}

export interface ComparativeCashFlow {
  operatingActivities: ComparativeLineItemGroup;
  investingActivities: ComparativeLineItemGroup;
  financingActivities: ComparativeLineItemGroup;
  
  // Summary
  netCashFlow: ComparativeLineItem;
  freeCashFlow: ComparativeLineItem;
  cashAtBeginning: ComparativeLineItem;
  cashAtEnd: ComparativeLineItem;
}

export interface ComparativeEquityChanges {
  shareCapital: ComparativeLineItem;
  retainedEarnings: ComparativeLineItem;
  otherReserves: ComparativeLineItem;
  totalEquity: ComparativeLineItem;
  
  // Movements
  profitForPeriod: ComparativeLineItem;
  dividendsPaid: ComparativeLineItem;
  sharesIssued: ComparativeLineItem;
}

export interface ComparativeLineItemGroup {
  groupName: string;
  lineItems: ComparativeLineItem[];
  subtotal: ComparativeLineItem;
  
  // Group-level analysis
  groupVariance: Variance;
  groupTrend: Trend;
}

export interface ComparativeLineItem {
  id: string;
  name: string;
  accountCode?: string;
  
  // Multi-period values
  periodValues: PeriodValue[];
  
  // Variance analysis
  periodVariances: Variance[];
  
  // Trend analysis
  trend: Trend;
  
  // Formatting and presentation
  isSubtotal: boolean;
  isTotal: boolean;
  indentLevel: number;
  emphasis: EmphasisLevel;
  
  // Notes and explanations
  notes: string[];
  hasSignificantVariance: boolean;
  varianceExplanation?: string;
  
  // Quality indicators
  dataQuality: DataQualityIndicator[];
  isEstimated: boolean;
  isAudited: boolean;
}

export interface PeriodValue {
  periodId: string;
  value: number;
  formattedValue: string;
  currency: string;
  
  // Context
  isActual: boolean;
  isBudget: boolean;
  isForecast: boolean;
  isRestated: boolean;
  
  // Supporting data
  transactionCount?: number;
  lastUpdated: Date;
  dataSource: string;
}

export interface Variance {
  fromPeriodId: string;
  toPeriodId: string;
  
  // Absolute variance
  absoluteVariance: number;
  formattedAbsoluteVariance: string;
  
  // Percentage variance
  percentageVariance: number;
  formattedPercentageVariance: string;
  
  // Variance analysis
  varianceType: VarianceType;
  varianceSignificance: VarianceSignificance;
  varianceTrend: VarianceTrend;
  
  // Explanations
  primaryCauses: VarianceCause[];
  managementExplanation?: string;
  
  // Flags
  isFavorable: boolean;
  isSignificant: boolean;
  requiresInvestigation: boolean;
}

export type VarianceType = 
  | 'increase'
  | 'decrease'
  | 'no-change'
  | 'new-item'
  | 'discontinued-item';

export type VarianceSignificance = 
  | 'immaterial'
  | 'noteworthy'
  | 'significant'
  | 'material'
  | 'exceptional';

export type VarianceTrend = 
  | 'accelerating'
  | 'decelerating'
  | 'stable'
  | 'reversing'
  | 'cyclical';

export interface VarianceCause {
  category: VarianceCauseCategory;
  description: string;
  estimatedImpact: number;
  confidence: ConfidenceLevel;
}

export type VarianceCauseCategory = 
  | 'volume'
  | 'price'
  | 'mix'
  | 'timing'
  | 'one-time'
  | 'operational'
  | 'market'
  | 'regulatory'
  | 'accounting'
  | 'error';

export type ConfidenceLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'very-high';

export interface Trend {
  direction: TrendDirection;
  strength: TrendStrength;
  consistency: TrendConsistency;
  
  // Statistical measures
  correlation: number; // -1 to 1
  slope: number;
  rSquared: number;
  
  // Projections
  projectedValues: ProjectedValue[];
  
  // Context
  trendStartDate: Date;
  seasonalAdjusted: boolean;
  outlierAdjusted: boolean;
}

export type TrendDirection = 
  | 'strongly-increasing'
  | 'increasing'
  | 'stable'
  | 'decreasing'
  | 'strongly-decreasing'
  | 'volatile'
  | 'cyclical';

export type TrendStrength = 
  | 'very-weak'
  | 'weak'
  | 'moderate'
  | 'strong'
  | 'very-strong';

export type TrendConsistency = 
  | 'highly-consistent'
  | 'consistent'
  | 'moderately-consistent'
  | 'inconsistent'
  | 'highly-volatile';

export interface ProjectedValue {
  periodId: string;
  projectedValue: number;
  confidenceInterval: ConfidenceInterval;
  methodology: ProjectionMethodology;
}

export interface ConfidenceInterval {
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number; // e.g., 95%
}

export type ProjectionMethodology = 
  | 'linear-regression'
  | 'moving-average'
  | 'exponential-smoothing'
  | 'seasonal-decomposition'
  | 'machine-learning'
  | 'management-estimate';

export type EmphasisLevel = 
  | 'none'
  | 'bold'
  | 'italic'
  | 'highlight'
  | 'warning'
  | 'critical';

export interface DataQualityIndicator {
  aspect: DataQualityAspect;
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

export type DataQualityAspect = 
  | 'completeness'
  | 'accuracy'
  | 'timeliness'
  | 'consistency'
  | 'validity'
  | 'integrity';

// Analysis Framework

export interface VarianceAnalysis {
  summary: VarianceAnalysisSummary;
  significantVariances: SignificantVariance[];
  drilldownAnalysis: DrilldownAnalysis[];
  
  // Insights
  keyObservations: string[];
  riskFactors: string[];
  opportunities: string[];
}

export interface VarianceAnalysisSummary {
  totalVariances: number;
  favorableVariances: number;
  unfavorableVariances: number;
  
  // Materiality
  materialVariances: number;
  aggregateFavorableImpact: number;
  aggregateUnfavorableImpact: number;
  
  // Categories
  variancesByCategory: { [category: string]: VarianceSummary };
}

export interface VarianceSummary {
  count: number;
  totalImpact: number;
  avgImpact: number;
  largestVariance: number;
}

export interface SignificantVariance {
  lineItemId: string;
  lineItemName: string;
  variance: Variance;
  
  // Investigation
  investigationPriority: InvestigationPriority;
  assignedTo?: string;
  investigationStatus: InvestigationStatus;
  findings?: VarianceFindings;
}

export type InvestigationPriority = 
  | 'immediate'
  | 'high'
  | 'medium'
  | 'low'
  | 'monitoring';

export type InvestigationStatus = 
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'escalated'
  | 'closed';

export interface VarianceFindings {
  rootCauses: VarianceCause[];
  correctedAmount?: number;
  ongoingImpact: boolean;
  actionRequired: boolean;
  recommendedActions: string[];
}

export interface DrilldownAnalysis {
  parentLineItemId: string;
  level: DrilldownLevel;
  breakdown: LineItemBreakdown[];
}

export type DrilldownLevel = 
  | 'summary'
  | 'detailed'
  | 'transaction';

export interface LineItemBreakdown {
  componentId: string;
  componentName: string;
  componentValue: number;
  contributionToVariance: number;
  contributionPercentage: number;
}

export interface TrendAnalysis {
  overallTrend: TrendSummary;
  keyMetricsTrends: KeyMetricTrend[];
  trendAlerts: TrendAlert[];
  
  // Statistical analysis
  seasonalPatterns: SeasonalPattern[];
  cyclicalPatterns: CyclicalPattern[];
  
  // Forecasting
  trendForecasts: TrendForecast[];
}

export interface TrendSummary {
  primaryDirection: TrendDirection;
  trendStrength: TrendStrength;
  volatility: VolatilityLevel;
  inflectionPoints: InflectionPoint[];
}

export type VolatilityLevel = 
  | 'very-low'
  | 'low'
  | 'moderate'
  | 'high'
  | 'very-high';

export interface InflectionPoint {
  periodId: string;
  description: string;
  significance: InflectionSignificance;
  suspectedCause: string;
}

export type InflectionSignificance = 
  | 'minor'
  | 'moderate'
  | 'major'
  | 'critical';

export interface KeyMetricTrend {
  metricName: string;
  trend: Trend;
  benchmarkComparison: BenchmarkComparison;
  strategicImplications: string[];
}

export interface BenchmarkComparison {
  benchmarkType: BenchmarkType;
  companyPerformance: number;
  benchmarkValue: number;
  relativePosition: RelativePosition;
  percentileRank: number;
}

export type BenchmarkType = 
  | 'industry-average'
  | 'industry-median'
  | 'peer-group'
  | 'best-in-class'
  | 'historical-performance';

export type RelativePosition = 
  | 'well-above'
  | 'above'
  | 'at'
  | 'below'
  | 'well-below';

export interface TrendAlert {
  alertType: TrendAlertType;
  severity: AlertSeverity;
  description: string;
  affectedMetrics: string[];
  
  // Timing
  firstDetected: Date;
  persistenceLevel: PersistenceLevel;
  
  // Response
  recommendedActions: string[];
  escalationRequired: boolean;
}

export type TrendAlertType = 
  | 'deteriorating-performance'
  | 'improving-performance'
  | 'unusual-volatility'
  | 'trend-reversal'
  | 'seasonal-anomaly'
  | 'benchmark-deviation';

export type AlertSeverity = 
  | 'informational'
  | 'warning'
  | 'critical'
  | 'urgent';

export type PersistenceLevel = 
  | 'one-period'
  | 'multiple-periods'
  | 'persistent'
  | 'systematic';

export interface SeasonalPattern {
  patternName: string;
  seasonalityStrength: number;
  peakPeriods: string[];
  troughPeriods: string[];
  cycleLengthMonths: number;
}

export interface CyclicalPattern {
  patternName: string;
  cycleLengthPeriods: number;
  amplitude: number;
  lastCyclePeak: string;
  nextExpectedPeak: string;
}

export interface TrendForecast {
  metricName: string;
  forecastHorizon: number; // Number of periods
  forecastValues: ProjectedValue[];
  forecastAccuracy: ForecastAccuracy;
  assumptions: ForecastAssumption[];
}

export interface ForecastAccuracy {
  historicalAccuracy: number; // Percentage
  confidenceLevel: number;
  errorMetrics: ErrorMetrics;
}

export interface ErrorMetrics {
  meanAbsoluteError: number;
  meanSquaredError: number;
  meanAbsolutePercentageError: number;
}

export interface ForecastAssumption {
  category: AssumptionCategory;
  description: string;
  confidence: ConfidenceLevel;
  sensitivityImpact: SensitivityImpact;
}

export type AssumptionCategory = 
  | 'economic'
  | 'industry'
  | 'company-specific'
  | 'regulatory'
  | 'seasonal'
  | 'operational';

export interface SensitivityImpact {
  optimisticScenario: number;
  pessimisticScenario: number;
  impactRange: number;
}

export interface RatioAnalysis {
  liquidityRatios: FinancialRatio[];
  profitabilityRatios: FinancialRatio[];
  efficiencyRatios: FinancialRatio[];
  leverageRatios: FinancialRatio[];
  
  // Analysis insights
  ratioTrends: RatioTrend[];
  benchmarkComparisons: RatioBenchmark[];
  deterioratingRatios: DeterioratingRatio[];
  
  // Summary assessment
  overallFinancialHealth: FinancialHealthScore;
}

export interface FinancialRatio {
  ratioName: string;
  ratioCategory: RatioCategory;
  periodValues: RatioPeriodValue[];
  
  // Analysis
  trend: Trend;
  benchmark: RatioBenchmark;
  
  // Interpretation
  interpretation: RatioInterpretation;
  significance: RatioSignificance;
}

export type RatioCategory = 
  | 'liquidity'
  | 'profitability'
  | 'efficiency'
  | 'leverage'
  | 'market'
  | 'coverage';

export interface RatioPeriodValue {
  periodId: string;
  value: number;
  formattedValue: string;
  
  // Components
  numerator: number;
  denominator: number;
  calculationNote?: string;
}

export interface RatioBenchmark {
  benchmarkType: BenchmarkType;
  benchmarkValue: number;
  companyValue: number;
  deviation: number;
  deviationSignificance: DeviationSignificance;
}

export type DeviationSignificance = 
  | 'negligible'
  | 'minor'
  | 'moderate'
  | 'significant'
  | 'major';

export interface RatioInterpretation {
  currentLevel: PerformanceLevel;
  trendDirection: TrendDirection;
  strengthsWeaknesses: StrengthWeakness[];
  strategicImplications: string[];
}

export type PerformanceLevel = 
  | 'excellent'
  | 'good'
  | 'satisfactory'
  | 'concerning'
  | 'poor';

export interface StrengthWeakness {
  type: 'strength' | 'weakness';
  description: string;
  impact: ImpactLevel;
  actionable: boolean;
}

export type RatioSignificance = 
  | 'key-indicator'
  | 'important'
  | 'supplementary'
  | 'monitoring';

export interface RatioTrend {
  ratioName: string;
  trendPeriods: number;
  overallTrend: TrendDirection;
  volatility: VolatilityLevel;
  inflectionPoints: InflectionPoint[];
}

export interface DeterioratingRatio {
  ratioName: string;
  currentValue: number;
  deteriorationRate: number;
  timeToWarningLevel: number; // Periods
  recommendedActions: string[];
}

export interface FinancialHealthScore {
  overallScore: number; // 0-100
  categoryScores: { [category: string]: number };
  
  // Assessment
  healthLevel: HealthLevel;
  keyStrengths: string[];
  keyRisks: string[];
  
  // Trends
  scoreTrend: TrendDirection;
  improvingAreas: string[];
  deterioratingAreas: string[];
}

export type HealthLevel = 
  | 'excellent'
  | 'strong'
  | 'adequate'
  | 'weak'
  | 'distressed';

// Comparative Adjustments and Restatements

export interface ComparativeAdjustment {
  id: string;
  adjustmentType: AdjustmentType;
  description: string;
  
  // IFRS compliance
  ifrsStandard: string;
  ifrsRequirement: string;
  
  // Impact
  affectedPeriods: string[];
  adjustmentAmounts: AdjustmentAmount[];
  
  // Documentation
  justification: string;
  supportingDocuments: string[];
  approvedBy: string;
  approvalDate: Date;
  
  // Disclosure
  requiresDisclosure: boolean;
  disclosureNote?: string;
}

export interface AdjustmentAmount {
  periodId: string;
  statementType: string;
  lineItem: string;
  adjustmentAmount: number;
  adjustedAmount: number;
  previousAmount: number;
}

export interface Restatement {
  id: string;
  restatementType: RestatementType;
  description: string;
  
  // Scope
  affectedPeriods: string[];
  affectedStatements: string[];
  
  // Nature of restatement
  natureOfChange: string;
  reasonForRestatement: string;
  
  // Impact quantification
  cumulativeImpact: number;
  periodImpacts: RestatementImpact[];
  
  // Process
  identifiedDate: Date;
  implementedDate: Date;
  implementedBy: string;
  
  // Disclosure and communication
  disclosureRequirements: DisclosureRequirement[];
  stakeholderCommunication: StakeholderCommunication[];
}

export type RestatementType = 
  | 'error-correction'
  | 'accounting-policy-change'
  | 'presentation-change'
  | 'classification-change'
  | 'estimate-revision';

export interface RestatementImpact {
  periodId: string;
  statementType: string;
  totalImpact: number;
  lineItemImpacts: LineItemImpact[];
}

export interface LineItemImpact {
  lineItem: string;
  previousAmount: number;
  restatedAmount: number;
  impactAmount: number;
  materiality: MaterialityLevel;
}

export type MaterialityLevel = 
  | 'immaterial'
  | 'below-materiality'
  | 'material'
  | 'highly-material';

export interface DisclosureRequirement {
  standard: string;
  requirement: string;
  disclosureText: string;
  prominenceLevel: ProminenceLevel;
}

export type ProminenceLevel = 
  | 'note'
  | 'highlighted-note'
  | 'face-of-statement'
  | 'cover-letter';

export interface StakeholderCommunication {
  stakeholderGroup: StakeholderGroup;
  communicationMethod: CommunicationMethod;
  message: string;
  communicationDate: Date;
  responseTracking: boolean;
}

export type StakeholderGroup = 
  | 'investors'
  | 'lenders'
  | 'auditors'
  | 'regulators'
  | 'board-of-directors'
  | 'management'
  | 'employees';

export type CommunicationMethod = 
  | 'formal-letter'
  | 'press-release'
  | 'regulatory-filing'
  | 'investor-call'
  | 'internal-memo'
  | 'website-update';

// Management Commentary and Insights

export interface ManagementCommentary {
  executiveSummary: string;
  sectionCommentaries: SectionCommentary[];
  
  // Forward-looking statements
  outlook: BusinessOutlook;
  riskFactors: RiskFactor[];
  opportunities: Opportunity[];
  
  // Strategic context
  strategicInitiatives: StrategicInitiative[];
  performanceAgainstTargets: PerformanceTarget[];
}

export interface SectionCommentary {
  section: StatementSection;
  commentary: string;
  keyPoints: string[];
  varianceExplanations: VarianceExplanation[];
}

export type StatementSection = 
  | 'revenue'
  | 'gross-profit'
  | 'operating-expenses'
  | 'operating-profit'
  | 'finance-costs'
  | 'net-income'
  | 'balance-sheet'
  | 'cash-flow'
  | 'equity';

export interface VarianceExplanation {
  lineItem: string;
  variance: number;
  explanation: string;
  category: VarianceCauseCategory;
  isOneTime: boolean;
  futureImpact: FutureImpactAssessment;
}

export interface FutureImpactAssessment {
  isRecurring: boolean;
  expectedDuration: string;
  estimatedFutureImpact: number;
  mitigationActions: string[];
}

export interface BusinessOutlook {
  outlookPeriod: string;
  overallSentiment: OutlookSentiment;
  
  // Expectations
  revenueOutlook: OutlookComponent;
  profitabilityOutlook: OutlookComponent;
  cashFlowOutlook: OutlookComponent;
  
  // Market and industry
  marketConditions: MarketCondition[];
  competitivePosition: CompetitivePosition;
  
  // Key assumptions
  keyAssumptions: OutlookAssumption[];
  
  // Scenarios
  scenarios: BusinessScenario[];
}

export type OutlookSentiment = 
  | 'very-positive'
  | 'positive'
  | 'neutral'
  | 'cautious'
  | 'negative';

export interface OutlookComponent {
  component: string;
  expectedTrend: TrendDirection;
  keyDrivers: string[];
  risks: string[];
  confidenceLevel: ConfidenceLevel;
}

export interface MarketCondition {
  factor: string;
  currentState: string;
  expectedEvolution: string;
  impactOnBusiness: string;
}

export interface CompetitivePosition {
  overallPosition: string;
  competitiveAdvantages: string[];
  competitiveChallenges: string[];
  marketShare: number;
  marketShareTrend: TrendDirection;
}

export interface OutlookAssumption {
  category: AssumptionCategory;
  assumption: string;
  impact: string;
  likelihood: Likelihood;
  sensitivityAnalysis: SensitivityAnalysis;
}

export type Likelihood = 
  | 'very-likely'
  | 'likely'
  | 'possible'
  | 'unlikely'
  | 'very-unlikely';

export interface SensitivityAnalysis {
  variable: string;
  baseCase: number;
  optimisticCase: number;
  pessimisticCase: number;
  keyThresholds: number[];
}

export interface BusinessScenario {
  scenarioName: string;
  probability: number;
  description: string;
  keyVariables: ScenarioVariable[];
  financialImpact: ScenarioImpact;
  strategicResponse: string;
}

export interface ScenarioVariable {
  variable: string;
  baseValue: number;
  scenarioValue: number;
  impactDescription: string;
}

export interface ScenarioImpact {
  revenueImpact: number;
  profitImpact: number;
  cashFlowImpact: number;
  timeframe: string;
}

export interface RiskFactor {
  riskCategory: RiskCategory;
  description: string;
  likelihood: Likelihood;
  potentialImpact: ImpactLevel;
  
  // Current mitigation
  currentMitigations: string[];
  residualRisk: RiskLevel;
  
  // Monitoring and response
  earlyWarningIndicators: string[];
  contingencyPlans: string[];
}

export type RiskCategory = 
  | 'strategic'
  | 'operational'
  | 'financial'
  | 'regulatory'
  | 'market'
  | 'technology'
  | 'reputation'
  | 'cyber-security';

export interface Opportunity {
  opportunityCategory: OpportunityCategory;
  description: string;
  potentialValue: number;
  likelihood: Likelihood;
  
  // Implementation
  requiredInvestment: number;
  timeToRealization: string;
  keySuccessFactors: string[];
  
  // Risk considerations
  implementationRisks: string[];
  competitiveResponse: string;
}

export type OpportunityCategory = 
  | 'market-expansion'
  | 'product-innovation'
  | 'operational-efficiency'
  | 'cost-reduction'
  | 'strategic-partnership'
  | 'digital-transformation'
  | 'sustainability';

export interface StrategicInitiative {
  initiativeName: string;
  description: string;
  strategicObjective: string;
  
  // Progress tracking
  milestones: Milestone[];
  currentStatus: InitiativeStatus;
  percentComplete: number;
  
  // Investment and returns
  totalInvestment: number;
  investmentToDate: number;
  expectedReturns: number;
  actualReturns?: number;
  
  // Timeline
  startDate: Date;
  plannedCompletionDate: Date;
  actualCompletionDate?: Date;
}

export interface Milestone {
  milestoneName: string;
  description: string;
  targetDate: Date;
  actualDate?: Date;
  status: MilestoneStatus;
  criticalPath: boolean;
}

export type InitiativeStatus = 
  | 'planning'
  | 'in-progress'
  | 'on-track'
  | 'behind-schedule'
  | 'at-risk'
  | 'completed'
  | 'cancelled';

export type MilestoneStatus = 
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'delayed'
  | 'at-risk';

export interface PerformanceTarget {
  targetName: string;
  targetCategory: TargetCategory;
  targetValue: number;
  actualValue: number;
  
  // Performance assessment
  achievementPercentage: number;
  performanceRating: PerformanceRating;
  
  // Context
  targetPeriod: string;
  strategicImportance: StrategicImportance;
  
  // Analysis
  varianceAnalysis: string;
  actionPlan: string;
}

export type TargetCategory = 
  | 'financial'
  | 'operational'
  | 'customer'
  | 'employee'
  | 'sustainability'
  | 'innovation';

export type PerformanceRating = 
  | 'exceeds-expectations'
  | 'meets-expectations'
  | 'below-expectations'
  | 'significantly-below';

export type StrategicImportance = 
  | 'critical'
  | 'important'
  | 'supporting'
  | 'aspirational';

export interface KeyInsight {
  insightCategory: InsightCategory;
  title: string;
  description: string;
  
  // Supporting data
  supportingMetrics: string[];
  dataPoints: InsightDataPoint[];
  
  // Impact and implications
  businessImpact: string;
  strategicImplications: string[];
  recommendedActions: string[];
  
  // Confidence and validation
  confidenceLevel: ConfidenceLevel;
  validationSources: string[];
}

export type InsightCategory = 
  | 'performance-driver'
  | 'risk-indicator'
  | 'opportunity-identifier'
  | 'efficiency-gain'
  | 'market-signal'
  | 'competitive-intelligence';

export interface InsightDataPoint {
  metric: string;
  value: number;
  context: string;
  significance: InsightSignificance;
}

export type InsightSignificance = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational';

// Validation and Quality

export interface ComparativeValidationResult {
  validationType: ValidationType;
  status: ValidationStatus;
  message: string;
  
  // Details
  affectedPeriods: string[];
  affectedItems: string[];
  
  // Severity and impact
  severity: ValidationSeverity;
  impact: ValidationImpact;
  
  // Resolution
  requiresAction: boolean;
  recommendedAction: string;
  assignedTo?: string;
  dueDate?: Date;
}

export type ValidationType = 
  | 'data-consistency'
  | 'calculation-accuracy'
  | 'period-alignment'
  | 'ifrs-compliance'
  | 'comparative-logic'
  | 'materiality-check';

export type ValidationStatus = 
  | 'passed'
  | 'warning'
  | 'failed'
  | 'skipped'
  | 'manual-review';

export type ValidationSeverity = 
  | 'informational'
  | 'warning'
  | 'error'
  | 'critical';

export interface ValidationImpact {
  impactArea: ImpactArea;
  description: string;
  quantifiedImpact?: number;
}

export type ImpactArea = 
  | 'accuracy'
  | 'reliability'
  | 'compliance'
  | 'usability'
  | 'timeliness';

export type ApprovalStatus = 
  | 'draft'
  | 'pending-review'
  | 'under-review'
  | 'approved'
  | 'rejected'
  | 'revision-required';