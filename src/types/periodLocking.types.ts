/**
 * Period Locking Types
 * 
 * Types for IFRS-compliant period locking and financial controls including:
 * - Accounting period controls
 * - Transaction cutoff procedures
 * - Financial statement finalization
 * - Audit trail and authorization controls
 */

export interface AccountingPeriod {
  id: string;
  companyId: string;
  periodType: PeriodType;
  
  // Period definition
  startDate: Date;
  endDate: Date;
  fiscalYear: number;
  periodNumber: number;
  periodName: string;
  
  // Status and controls
  status: PeriodStatus;
  lockStatus: LockStatus;
  lockDate?: Date;
  lockedBy?: string;
  lockReason?: string;
  
  // Financial statement preparation
  financialStatementStatus: FinancialStatementStatus;
  preparationDeadline: Date;
  submissionDeadline: Date;
  
  // Authorization and approval
  authorizationLevels: AuthorizationLevel[];
  approvals: PeriodApproval[];
  
  // Cutoff controls
  cutoffControls: CutoffControl[];
  transactionCutoff: Date;
  
  // Audit and compliance
  auditTrail: PeriodAuditEntry[];
  complianceChecks: ComplianceCheck[];
  
  // Reporting requirements
  reportingRequirements: ReportingRequirement[];
  ifrsCompliant: boolean;
  
  // Adjustments and reversals
  adjustmentPeriod?: Date;
  reversalControls: ReversalControl[];
  
  metadata: PeriodMetadata;
}

export type PeriodType = 
  | 'monthly'
  | 'quarterly'
  | 'semi-annually'
  | 'annually'
  | 'interim'
  | 'year-end';

export type PeriodStatus = 
  | 'open' // Transactions can be posted
  | 'closing' // In process of closing
  | 'closed' // No transactions allowed
  | 'locked' // Completely locked, no changes
  | 'reopened' // Temporarily reopened
  | 'archived'; // Historical periods

export type LockStatus = 
  | 'unlocked'
  | 'soft-lock' // Warnings but allows transactions
  | 'hard-lock' // Prevents all transactions
  | 'admin-lock' // Only admin can modify
  | 'audit-lock' // Locked for audit purposes
  | 'regulatory-lock'; // Regulatory compliance lock

export type FinancialStatementStatus = 
  | 'not-started'
  | 'in-preparation'
  | 'draft-complete'
  | 'under-review'
  | 'approved'
  | 'published'
  | 'filed';

export interface AuthorizationLevel {
  level: number;
  roleName: string;
  permissions: Permission[];
  userIds: string[];
  requiredApprovals: number;
  
  // Conditions
  amountThreshold?: number;
  transactionTypes?: string[];
  accountCategories?: string[];
}

export type Permission = 
  | 'post-transactions'
  | 'post-adjustments'
  | 'reverse-transactions'
  | 'close-period'
  | 'lock-period'
  | 'unlock-period'
  | 'approve-statements'
  | 'publish-statements';

export interface PeriodApproval {
  id: string;
  approvalType: ApprovalType;
  approverUserId: string;
  approverRole: string;
  approvalDate: Date;
  status: ApprovalStatus;
  comments: string;
  
  // Digital signature
  digitalSignature?: DigitalSignature;
  
  // Conditional approvals
  conditions?: ApprovalCondition[];
  
  // Workflow
  workflowStep: number;
  nextApprover?: string;
}

export type ApprovalType = 
  | 'period-close'
  | 'financial-statements'
  | 'adjusting-entries'
  | 'management-override'
  | 'regulatory-filing'
  | 'audit-sign-off';

export type ApprovalStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'conditionally-approved'
  | 'withdrawn';

export interface DigitalSignature {
  signerUserId: string;
  signerName: string;
  signatureHash: string;
  signatureDate: Date;
  certificateId: string;
  isValid: boolean;
}

export interface ApprovalCondition {
  condition: string;
  isMet: boolean;
  verifiedDate?: Date;
  verifiedBy?: string;
}

export interface CutoffControl {
  id: string;
  controlType: CutoffControlType;
  description: string;
  
  // Cutoff timing
  cutoffDate: Date;
  gracePeriod?: number; // Hours after cutoff
  
  // Control rules
  affectedTransactionTypes: string[];
  affectedAccounts: string[];
  automaticCutoff: boolean;
  
  // Enforcement
  isActive: boolean;
  enforcementLevel: EnforcementLevel;
  overridePermissions: string[];
  
  // Monitoring
  violationCount: number;
  lastViolation?: Date;
  
  // Documentation
  businessJustification: string;
  ifrsReference?: string;
}

export type CutoffControlType = 
  | 'transaction-posting'
  | 'revenue-recognition'
  | 'expense-accrual'
  | 'asset-valuation'
  | 'inventory-counting'
  | 'bank-reconciliation'
  | 'intercompany-elimination';

export type EnforcementLevel = 
  | 'warning' // Show warning but allow
  | 'block' // Prevent transaction
  | 'require-approval' // Need special approval
  | 'escalate'; // Escalate to higher authority

export interface ReversalControl {
  id: string;
  originalTransactionId: string;
  reversalTransactionId?: string;
  
  // Reversal details
  reversalType: ReversalType;
  reversalReason: string;
  reversalDate: Date;
  
  // Authorization
  authorizedBy: string;
  approvedBy?: string;
  authorizationLevel: number;
  
  // Impact assessment
  financialImpact: ReversalImpact;
  affectedStatements: string[];
  
  // Audit trail
  originalPostingDate: Date;
  reversalPostingDate: Date;
  auditTrail: string[];
  
  // Compliance
  requiresDisclosure: boolean;
  disclosureCategory?: string;
  ifrsImplications: string[];
}

export type ReversalType = 
  | 'error-correction' // IAS 8 prior period errors
  | 'estimate-change' // IAS 8 change in estimate
  | 'policy-change' // IAS 8 change in policy
  | 'reclassification' // Statement presentation
  | 'cutoff-adjustment' // Period-end cutoff
  | 'management-override'; // Override of controls

export interface ReversalImpact {
  netIncomeImpact: number;
  balanceSheetImpact: number;
  cashFlowImpact: number;
  taxImpact: number;
  
  // Materiality assessment
  isMaterial: boolean;
  materialityBasis: string;
  materialityPercentage: number;
}

export interface ComplianceCheck {
  id: string;
  checkType: ComplianceCheckType;
  description: string;
  
  // Check execution
  executionDate: Date;
  executedBy: string;
  automatedCheck: boolean;
  
  // Results
  status: ComplianceStatus;
  findings: ComplianceFinding[];
  
  // Remediation
  remediationRequired: boolean;
  remediationActions: RemediationAction[];
  remediationDeadline?: Date;
  
  // Regulatory requirements
  regulatoryFramework: RegulatoryFramework[];
  complianceRating: ComplianceRating;
}

export type ComplianceCheckType = 
  | 'ifrs-compliance'
  | 'sox-controls'
  | 'regulatory-reporting'
  | 'internal-controls'
  | 'data-integrity'
  | 'authorization-controls'
  | 'segregation-duties'
  | 'audit-readiness';

export type ComplianceStatus = 
  | 'compliant'
  | 'non-compliant'
  | 'partially-compliant'
  | 'under-review'
  | 'remediated'
  | 'exception-approved';

export interface ComplianceFinding {
  id: string;
  severity: FindingSeverity;
  category: string;
  description: string;
  evidence: string[];
  impact: string;
  recommendation: string;
  
  // Tracking
  identifiedDate: Date;
  identifiedBy: string;
  status: FindingStatus;
  
  // Resolution
  resolutionDate?: Date;
  resolutionNotes?: string;
  resolvedBy?: string;
}

export type FindingSeverity = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational';

export type FindingStatus = 
  | 'open'
  | 'in-progress'
  | 'resolved'
  | 'accepted-risk'
  | 'false-positive';

export interface RemediationAction {
  id: string;
  action: string;
  assignedTo: string;
  dueDate: Date;
  status: ActionStatus;
  
  // Implementation
  implementationNotes?: string;
  completionDate?: Date;
  verificationRequired: boolean;
  verifiedBy?: string;
}

export type ActionStatus = 
  | 'assigned'
  | 'in-progress'
  | 'completed'
  | 'verified'
  | 'overdue';

export interface ReportingRequirement {
  id: string;
  requirementType: ReportingType;
  regulatoryBody: string;
  
  // Timing
  dueDate: Date;
  frequency: ReportingFrequency;
  gracePeriod?: number;
  
  // Content requirements
  requiredStatements: string[];
  requiredDisclosures: string[];
  requiredCertifications: string[];
  
  // Submission
  submissionMethod: SubmissionMethod;
  submissionStatus: SubmissionStatus;
  submissionDate?: Date;
  confirmationNumber?: string;
  
  // Compliance
  isCompliant: boolean;
  complianceNotes: string[];
}

export type ReportingType = 
  | 'annual-filing'
  | 'quarterly-filing'
  | 'interim-reporting'
  | 'regulatory-filing'
  | 'tax-filing'
  | 'statistical-reporting';

export type ReportingFrequency = 
  | 'monthly'
  | 'quarterly'
  | 'semi-annually'
  | 'annually'
  | 'ad-hoc';

export type SubmissionMethod = 
  | 'electronic-filing'
  | 'paper-filing'
  | 'web-portal'
  | 'api-submission'
  | 'email-submission';

export type SubmissionStatus = 
  | 'not-submitted'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'under-review';

export interface PeriodAuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: AuditAction;
  
  // Details
  entityType: string;
  entityId: string;
  previousValue?: unknown;
  newValue?: unknown;
  
  // Context
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  
  // Impact
  impactLevel: ImpactLevel;
  affectedProcesses: string[];
  
  // Compliance
  complianceImplication?: string;
  regulatoryImpact?: string;
}

export type AuditAction = 
  | 'period-created'
  | 'period-opened'
  | 'period-closed'
  | 'period-locked'
  | 'period-unlocked'
  | 'period-reopened'
  | 'transaction-posted'
  | 'transaction-reversed'
  | 'adjustment-posted'
  | 'approval-granted'
  | 'approval-rejected'
  | 'override-executed'
  | 'cutoff-violation'
  | 'compliance-check'
  | 'statement-approved'
  | 'statement-published';

export type ImpactLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface PeriodMetadata {
  createdDate: Date;
  createdBy: string;
  lastModifiedDate: Date;
  lastModifiedBy: string;
  
  // Configuration
  configuration: PeriodConfiguration;
  
  // Statistics
  statistics: PeriodStatistics;
  
  // Integration
  externalSystems: ExternalSystemIntegration[];
}

export interface PeriodConfiguration {
  allowBackdating: boolean;
  backdatingLimit?: number; // Days
  requireApprovalForAdjustments: boolean;
  automaticAccruals: boolean;
  automaticReversals: boolean;
  
  // Cutoff settings
  defaultCutoffTime: string; // HH:MM format
  timeZone: string;
  
  // Materiality thresholds
  materialityThreshold: number;
  adjustmentThreshold: number;
  
  // Workflow settings
  approvalWorkflow: WorkflowConfiguration;
}

export interface WorkflowConfiguration {
  isEnabled: boolean;
  steps: WorkflowStep[];
  parallelApproval: boolean;
  escalationRules: EscalationRule[];
}

export interface WorkflowStep {
  stepNumber: number;
  stepName: string;
  approverRole: string;
  isRequired: boolean;
  timeoutHours?: number;
}

export interface EscalationRule {
  condition: string;
  escalationLevel: number;
  escalationTarget: string;
  timeoutHours: number;
}

export interface PeriodStatistics {
  totalTransactions: number;
  totalAdjustments: number;
  totalReversals: number;
  
  // Timing statistics
  averageCloseTime: number; // Hours
  compliancePercentage: number;
  
  // Error statistics
  errorCount: number;
  warningCount: number;
  exceptionCount: number;
}

export interface ExternalSystemIntegration {
  systemName: string;
  integrationType: IntegrationType;
  lastSync: Date;
  syncStatus: SyncStatus;
  
  // Configuration
  syncFrequency: string;
  dataMapping: unknown;
  
  // Error handling
  errorCount: number;
  lastError?: string;
}

export type IntegrationType = 
  | 'real-time'
  | 'batch'
  | 'manual'
  | 'api';

export type SyncStatus = 
  | 'synchronized'
  | 'out-of-sync'
  | 'error'
  | 'pending';

export type RegulatoryFramework = 
  | 'IFRS'
  | 'US-GAAP'
  | 'SOX'
  | 'SEC'
  | 'Local-GAAP'
  | 'Tax-Regulations';

export type ComplianceRating = 
  | 'Excellent'
  | 'Good'
  | 'Satisfactory'
  | 'Needs-Improvement'
  | 'Unsatisfactory';

// Period Locking Operations
export interface PeriodLockRequest {
  periodId: string;
  lockType: LockStatus;
  requestedBy: string;
  reason: string;
  
  // Authorization
  authorizationLevel: number;
  approvals: PeriodApproval[];
  
  // Impact assessment
  impactAssessment: LockImpactAssessment;
  
  // Notifications
  notificationList: string[];
  
  // Scheduling
  scheduledLockDate?: Date;
  automaticUnlockDate?: Date;
}

export interface LockImpactAssessment {
  affectedUsers: string[];
  affectedProcesses: string[];
  affectedReports: string[];
  
  // Business impact
  businessImpact: BusinessImpact;
  
  // Risk assessment
  riskLevel: RiskLevel;
  mitigationActions: string[];
}

export interface BusinessImpact {
  impactLevel: ImpactLevel;
  description: string;
  duration: number; // Hours
  
  // Financial impact
  estimatedCost?: number;
  revenueImpact?: number;
}

export type RiskLevel = 
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';