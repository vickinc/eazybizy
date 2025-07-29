/**
 * Audit Trail and Controls Types
 * 
 * Comprehensive audit trail and internal controls framework for:
 * - SOX compliance (Sarbanes-Oxley Act)
 * - IFRS audit requirements
 * - Internal control over financial reporting (ICFR)
 * - Change management and approval workflows
 * - User access controls and segregation of duties
 */

export interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  
  // User information
  userId: string;
  userName: string;
  userRole: string;
  sessionId: string;
  
  // Technical details
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  geolocation?: GeolocationData;
  
  // Action details
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName?: string;
  
  // Change tracking
  previousValue?: unknown;
  newValue?: unknown;
  changedFields?: string[];
  
  // Business context
  businessJustification?: string;
  riskLevel: RiskLevel;
  impactLevel: ImpactLevel;
  
  // Compliance and approval
  requiresApproval: boolean;
  approvalStatus?: ApprovalStatus;
  approvedBy?: string;
  approvalDate?: Date;
  
  // SOX specific fields
  soxRelevant: boolean;
  soxControlId?: string;
  icfrImpact: boolean;
  
  // Financial statement impact
  affectedStatements: FinancialStatementType[];
  financialImpact?: FinancialImpact;
  materialityAssessment?: MaterialityAssessment;
  
  // Workflow and process
  processName: string;
  processStep?: string;
  workflowId?: string;
  
  // Evidence and documentation
  supportingDocuments: Document[];
  digitalSignature?: DigitalSignature;
  
  // Error handling
  errorCode?: string;
  errorMessage?: string;
  
  // Retention and archival
  retentionPeriod: number; // Years
  archivalDate?: Date;
  legalHoldStatus?: LegalHoldStatus;
}

export type AuditAction = 
  // Data operations
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'bulk-update'
  | 'import'
  | 'export'
  
  // Financial operations
  | 'transaction-post'
  | 'transaction-reverse'
  | 'adjustment-entry'
  | 'accrual-entry'
  | 'closing-entry'
  
  // Period operations
  | 'period-open'
  | 'period-close'
  | 'period-lock'
  | 'period-unlock'
  | 'period-reopen'
  
  // Approval workflow
  | 'submit-for-approval'
  | 'approve'
  | 'reject'
  | 'withdraw'
  | 'escalate'
  
  // Financial statements
  | 'statement-prepare'
  | 'statement-review'
  | 'statement-approve'
  | 'statement-publish'
  | 'statement-file'
  
  // System administration
  | 'user-create'
  | 'user-modify'
  | 'user-deactivate'
  | 'role-assign'
  | 'permission-grant'
  | 'permission-revoke'
  
  // Configuration changes
  | 'config-change'
  | 'policy-update'
  | 'control-modify'
  | 'threshold-change'
  
  // Security events
  | 'login'
  | 'logout'
  | 'password-change'
  | 'access-denied'
  | 'privilege-escalation'
  | 'suspicious-activity'
  
  // Data integrity
  | 'backup'
  | 'restore'
  | 'reconciliation'
  | 'validation'
  
  // Compliance
  | 'compliance-check'
  | 'control-test'
  | 'audit-preparation'
  | 'regulatory-filing';

export type RiskLevel = 
  | 'Very Low'
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Very High'
  | 'Critical';

export type ImpactLevel = 
  | 'Minimal'
  | 'Minor'
  | 'Moderate'
  | 'Major'
  | 'Severe'
  | 'Critical';

export type ApprovalStatus = 
  | 'not-required'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'conditionally-approved'
  | 'escalated'
  | 'withdrawn'
  | 'expired';

export type FinancialStatementType = 
  | 'Balance Sheet'
  | 'Profit & Loss'
  | 'Cash Flow'
  | 'Equity Changes'
  | 'Notes'
  | 'Consolidated'
  | 'Segment';

export interface FinancialImpact {
  amount: number;
  currency: string;
  statementLineItem: string;
  impactType: ImpactType;
  
  // Materiality
  isMaterial: boolean;
  materialityPercentage: number;
  materialityBasis: string;
  
  // Period impact
  currentPeriodImpact: number;
  priorPeriodImpact?: number;
  cumulativeImpact: number;
}

export type ImpactType = 
  | 'revenue'
  | 'expense'
  | 'asset'
  | 'liability'
  | 'equity'
  | 'cash-flow'
  | 'comprehensive-income';

export interface MaterialityAssessment {
  threshold: number;
  basis: MaterialityBasis;
  isMaterial: boolean;
  assessmentDate: Date;
  assessedBy: string;
  justification: string;
}

export type MaterialityBasis = 
  | 'net-income'
  | 'revenue'
  | 'total-assets'
  | 'equity'
  | 'custom';

export interface GeolocationData {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  path: string;
  hash: string;
  uploadDate: Date;
  uploadedBy: string;
  size: number;
  isConfidential: boolean;
}

export type DocumentType = 
  | 'approval-form'
  | 'supporting-evidence'
  | 'authorization'
  | 'calculation'
  | 'screenshot'
  | 'email'
  | 'contract'
  | 'invoice'
  | 'receipt'
  | 'bank-statement'
  | 'policy-document';

export interface DigitalSignature {
  signerUserId: string;
  signerName: string;
  signatureData: string;
  signatureAlgorithm: string;
  signatureDate: Date;
  certificateId: string;
  isValid: boolean;
  validationDate?: Date;
}

export type LegalHoldStatus = 
  | 'none'
  | 'pending'
  | 'active'
  | 'released'
  | 'preservation-order';

// Internal Controls Framework

export interface InternalControl {
  id: string;
  controlId: string; // Business-friendly identifier
  name: string;
  description: string;
  
  // Classification
  controlType: ControlType;
  controlNature: ControlNature;
  controlFrequency: ControlFrequency;
  
  // SOX classification
  isSoxControl: boolean;
  soxControlType?: SOXControlType;
  cososComponent: COSOComponent;
  
  // IFRS relevance
  ifrsRelevant: boolean;
  ifrsStandards: string[];
  
  // Risk and objectives
  riskCategory: RiskCategory;
  controlObjective: string;
  businessProcess: BusinessProcess;
  
  // Control design
  controlActivity: string;
  controlOwner: string;
  controlOperator: string;
  
  // Testing and validation
  testingFrequency: TestingFrequency;
  lastTestDate?: Date;
  nextTestDate?: Date;
  testResults: ControlTestResult[];
  
  // Effectiveness
  designEffectiveness: ControlEffectiveness;
  operatingEffectiveness: ControlEffectiveness;
  
  // Dependencies and relationships
  dependentControls: string[];
  compensatingControls: string[];
  
  // Documentation
  controlDocumentation: ControlDocumentation;
  procedureReference: string;
  
  // Monitoring
  continuousMonitoring: boolean;
  monitoringMethods: MonitoringMethod[];
  
  // Status and lifecycle
  status: ControlStatus;
  effectiveDate: Date;
  retirementDate?: Date;
  
  // Compliance and audit
  auditAttention: boolean;
  deficiencies: ControlDeficiency[];
  managementActions: ManagementAction[];
}

export type ControlType = 
  | 'preventive'
  | 'detective'
  | 'corrective'
  | 'directive'
  | 'compensating';

export type ControlNature = 
  | 'manual'
  | 'automated'
  | 'hybrid'
  | 'system-enforced';

export type ControlFrequency = 
  | 'real-time'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annually'
  | 'event-driven';

export type SOXControlType = 
  | 'entity-level'
  | 'application-level'
  | 'general-it'
  | 'process-level'
  | 'transaction-level';

export type COSOComponent = 
  | 'control-environment'
  | 'risk-assessment'
  | 'control-activities'
  | 'information-communication'
  | 'monitoring-activities';

export type RiskCategory = 
  | 'financial-reporting'
  | 'operational'
  | 'compliance'
  | 'strategic'
  | 'reputation'
  | 'cyber-security'
  | 'fraud';

export type BusinessProcess = 
  | 'revenue'
  | 'procurement'
  | 'payroll'
  | 'inventory'
  | 'cash-treasury'
  | 'financial-reporting'
  | 'tax'
  | 'consolidation'
  | 'period-close';

export type TestingFrequency = 
  | 'quarterly'
  | 'semi-annually'
  | 'annually'
  | 'risk-based'
  | 'continuous';

export interface ControlTestResult {
  id: string;
  testDate: Date;
  testedBy: string;
  testType: TestType;
  
  // Test scope
  populationSize?: number;
  sampleSize?: number;
  samplingMethod?: SamplingMethod;
  
  // Results
  testResult: TestResult;
  exceptions: ControlException[];
  
  // Assessment
  designConclusion: TestConclusion;
  operatingConclusion: TestConclusion;
  
  // Documentation
  testDocumentation: string;
  workpapers: Document[];
  
  // Follow-up
  followUpRequired: boolean;
  followUpActions: string[];
  followUpDate?: Date;
}

export type TestType = 
  | 'walkthrough'
  | 'design-test'
  | 'operating-test'
  | 'substantive-test'
  | 'inquiry'
  | 'observation'
  | 'inspection'
  | 'reperformance';

export type SamplingMethod = 
  | 'judgmental'
  | 'statistical'
  | 'systematic'
  | 'random'
  | 'haphazard';

export type TestResult = 
  | 'effective'
  | 'deficient'
  | 'significant-deficiency'
  | 'material-weakness'
  | 'not-tested';

export interface ControlException {
  id: string;
  description: string;
  severity: ExceptionSeverity;
  rootCause: string;
  financialImpact?: number;
  compensatingControls: string[];
  remediation: RemediationPlan;
}

export type ExceptionSeverity = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface RemediationPlan {
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: RemediationStatus;
  completionDate?: Date;
  verificationRequired: boolean;
}

export type RemediationStatus = 
  | 'planned'
  | 'in-progress'
  | 'completed'
  | 'verified'
  | 'overdue';

export type TestConclusion = 
  | 'effective'
  | 'deficient'
  | 'not-applicable'
  | 'not-tested';

export type ControlEffectiveness = 
  | 'effective'
  | 'partially-effective'
  | 'ineffective'
  | 'not-evaluated';

export interface ControlDocumentation {
  procedureDocument: string;
  flowchartReference?: string;
  riskControlMatrix?: string;
  testingGuidance?: string;
  lastUpdated: Date;
  updatedBy: string;
}

export type MonitoringMethod = 
  | 'management-review'
  | 'self-assessment'
  | 'automated-monitoring'
  | 'continuous-auditing'
  | 'key-indicators'
  | 'exception-reporting';

export type ControlStatus = 
  | 'active'
  | 'inactive'
  | 'under-development'
  | 'under-review'
  | 'retired'
  | 'suspended';

export interface ControlDeficiency {
  id: string;
  deficiencyType: DeficiencyType;
  severity: DeficiencySeverity;
  description: string;
  identifiedDate: Date;
  identifiedBy: string;
  
  // Impact assessment
  impactAssessment: DeficiencyImpact;
  compensatingControls: string[];
  
  // Remediation
  remediation: RemediationPlan;
  
  // Reporting
  reportedToManagement: boolean;
  reportedToAuditCommittee: boolean;
  reportingDate?: Date;
  
  // SOX implications
  soxImplication: SOXImplication;
}

export type DeficiencyType = 
  | 'design-deficiency'
  | 'operating-deficiency'
  | 'both';

export type DeficiencySeverity = 
  | 'control-deficiency'
  | 'significant-deficiency'
  | 'material-weakness';

export interface DeficiencyImpact {
  likelihood: Likelihood;
  magnitude: Magnitude;
  aggregatedImpact: string;
  affectedAssertions: FinancialAssertion[];
}

export type Likelihood = 
  | 'remote'
  | 'reasonably-possible'
  | 'probable';

export type Magnitude = 
  | 'inconsequential'
  | 'more-than-inconsequential'
  | 'material';

export type FinancialAssertion = 
  | 'existence'
  | 'completeness'
  | 'accuracy'
  | 'cutoff'
  | 'classification'
  | 'valuation'
  | 'rights-obligations'
  | 'presentation-disclosure';

export type SOXImplication = 
  | 'none'
  | 'icfr-deficiency'
  | 'significant-deficiency'
  | 'material-weakness';

export interface ManagementAction {
  id: string;
  actionType: ManagementActionType;
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: ActionStatus;
  
  // Progress tracking
  progressNotes: ProgressNote[];
  completionEvidence: Document[];
  
  // Verification
  verificationRequired: boolean;
  verifiedBy?: string;
  verificationDate?: Date;
}

export type ManagementActionType = 
  | 'process-improvement'
  | 'control-enhancement'
  | 'training'
  | 'technology-upgrade'
  | 'policy-update'
  | 'organizational-change'
  | 'compensation-control';

export type ActionStatus = 
  | 'planned'
  | 'in-progress'
  | 'completed'
  | 'verified'
  | 'overdue'
  | 'cancelled';

export interface ProgressNote {
  id: string;
  date: Date;
  author: string;
  note: string;
  percentComplete: number;
  attachments: Document[];
}

// Access Controls and Segregation of Duties

export interface AccessControl {
  id: string;
  userId: string;
  resourceType: ResourceType;
  resourceId: string;
  permission: Permission;
  
  // Context
  grantedBy: string;
  grantedDate: Date;
  expirationDate?: Date;
  
  // Business justification
  businessJustification: string;
  riskAssessment: string;
  
  // Approval
  approvedBy: string;
  approvalDate: Date;
  
  // Monitoring
  lastAccessed?: Date;
  accessCount: number;
  
  // Status
  isActive: boolean;
  suspensionReason?: string;
  suspendedDate?: Date;
}

export type ResourceType = 
  | 'financial-data'
  | 'system-function'
  | 'report'
  | 'configuration'
  | 'administration'
  | 'approval-workflow';

export type Permission = 
  | 'read'
  | 'write'
  | 'execute'
  | 'approve'
  | 'admin'
  | 'super-admin';

export interface SegregationOfDutiesRule {
  id: string;
  ruleName: string;
  description: string;
  
  // Conflicting roles/functions
  conflictingRoles: string[];
  conflictingFunctions: string[];
  
  // Risk information
  riskRating: RiskLevel;
  businessRisk: string;
  
  // Enforcement
  isEnforced: boolean;
  enforcementLevel: EnforcementLevel;
  
  // Exceptions
  allowedExceptions: SODException[];
  
  // Monitoring
  violationCount: number;
  lastViolationDate?: Date;
  
  // Compliance framework
  regulatoryRequirement?: string;
  soxRelevant: boolean;
}

export type EnforcementLevel = 
  | 'preventive' // Block the action
  | 'detective' // Allow but flag
  | 'advisory'; // Warning only

export interface SODException {
  id: string;
  userId: string;
  conflictingRoles: string[];
  
  // Business justification
  businessJustification: string;
  temporaryException: boolean;
  exceptionPeriod?: DateRange;
  
  // Risk mitigation
  compensatingControls: string[];
  additionalMonitoring: string[];
  
  // Approval
  approvedBy: string;
  approvalDate: Date;
  approvalLevel: number;
  
  // Review
  reviewFrequency: ReviewFrequency;
  lastReviewDate?: Date;
  nextReviewDate?: Date;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type ReviewFrequency = 
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'semi-annually'
  | 'annually';

// Audit and Compliance Reporting

export interface AuditReport {
  id: string;
  reportType: AuditReportType;
  title: string;
  period: DateRange;
  
  // Generation details
  generatedBy: string;
  generatedDate: Date;
  reportParameters: AuditReportParameters;
  
  // Content
  executiveSummary: string;
  findings: AuditFinding[];
  recommendations: AuditRecommendation[];
  
  // Metrics and KPIs
  controlsTestResults: ControlTestSummary;
  riskMetrics: RiskMetrics;
  complianceMetrics: ComplianceMetrics;
  
  // Distribution
  distributionList: string[];
  confidentialityLevel: ConfidentialityLevel;
  
  // Status
  status: ReportStatus;
  approvedBy?: string;
  approvalDate?: Date;
}

export type AuditReportType = 
  | 'internal-audit'
  | 'sox-assessment'
  | 'icfr-evaluation'
  | 'compliance-review'
  | 'risk-assessment'
  | 'operational-audit'
  | 'it-audit'
  | 'financial-audit-support';

export interface AuditReportParameters {
  includeControlTests: boolean;
  includeSODViolations: boolean;
  includeAccessReview: boolean;
  riskLevelFilter?: RiskLevel[];
  processFilter?: BusinessProcess[];
  dateRangeFilter?: DateRange;
  materialityThreshold?: number;
}

export interface AuditFinding {
  id: string;
  findingType: FindingType;
  severity: FindingSeverity;
  title: string;
  description: string;
  
  // Context
  affectedProcesses: BusinessProcess[];
  affectedControls: string[];
  
  // Risk assessment
  riskRating: RiskLevel;
  potentialImpact: string;
  
  // Evidence
  supportingEvidence: Document[];
  
  // Management response
  managementResponse?: string;
  managementActions: ManagementAction[];
  
  // Timeline
  identifiedDate: Date;
  targetResolutionDate?: Date;
  actualResolutionDate?: Date;
}

export type FindingType = 
  | 'control-deficiency'
  | 'sod-violation'
  | 'access-issue'
  | 'process-weakness'
  | 'compliance-gap'
  | 'data-integrity'
  | 'documentation-gap';

export type FindingSeverity = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'material-weakness';

export interface AuditRecommendation {
  id: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  description: string;
  
  // Implementation
  implementationSteps: string[];
  estimatedEffort: string;
  requiredResources: string[];
  
  // Timeline
  recommendedImplementationDate: Date;
  
  // Benefits
  expectedBenefits: string[];
  riskReduction: RiskLevel;
}

export type RecommendationPriority = 
  | 'immediate'
  | 'high'
  | 'medium'
  | 'low'
  | 'future-consideration';

export type RecommendationCategory = 
  | 'control-enhancement'
  | 'process-improvement'
  | 'technology-upgrade'
  | 'training'
  | 'policy-update'
  | 'organizational-change';

export interface ControlTestSummary {
  totalControlsTested: number;
  effectiveControls: number;
  deficientControls: number;
  materialWeaknesses: number;
  significantDeficiencies: number;
  
  // By category
  testResultsByCategory: { [category: string]: TestResultStats };
  testResultsByProcess: { [process: string]: TestResultStats };
}

export interface TestResultStats {
  tested: number;
  effective: number;
  deficient: number;
  effectivenessRate: number;
}

export interface RiskMetrics {
  overallRiskScore: number;
  riskTrend: TrendDirection;
  
  // Risk distribution
  riskByCategory: { [category: string]: number };
  riskByProcess: { [process: string]: number };
  
  // Top risks
  topRisks: TopRisk[];
}

export type TrendDirection = 
  | 'improving'
  | 'stable'
  | 'deteriorating';

export interface TopRisk {
  riskDescription: string;
  riskScore: number;
  affectedProcesses: string[];
  mitigationStatus: string;
}

export interface ComplianceMetrics {
  overallComplianceScore: number;
  soxComplianceScore: number;
  ifrsComplianceScore: number;
  
  // Compliance gaps
  complianceGaps: ComplianceGap[];
  
  // Regulatory adherence
  regulatoryAdherence: { [framework: string]: number };
}

export interface ComplianceGap {
  requirement: string;
  framework: string;
  gapDescription: string;
  severity: string;
  remediationPlan: string;
}

export type ConfidentialityLevel = 
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'top-secret';

export type ReportStatus = 
  | 'draft'
  | 'under-review'
  | 'approved'
  | 'published'
  | 'archived';