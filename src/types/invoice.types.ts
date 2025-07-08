// Core invoice item interface
export interface InvoiceItem {
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  total: number;
}

// Core invoice interface
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'archived';
  dueDate: string;
  issueDate: string;
  paidDate?: string;
  createdAt?: string;
  template: string;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  fromCompanyId: number;
  paymentMethodIds: string[];
  notes?: string;
}

// Enhanced invoice interface with pre-formatted display data
export interface FormattedInvoice extends Invoice {
  // Pre-formatted display data
  formattedSubtotal: string;
  formattedTaxAmount: string;
  formattedTotalAmount: string;
  formattedIssueDate: string;
  formattedDueDate: string;
  formattedPaidDate?: string;
  formattedCreatedAt?: string;
  
  // Status configuration
  statusConfig: {
    value: string;
    label: string;
    color: string;
    bgColor: string;
  };
  
  // Computed fields
  daysOverdue?: number;
  isOverdue: boolean;
  daysToDue: number;
  
  // Company information
  companyInfo?: {
    id: number;
    tradingName: string;
    legalName: string;
    logo: string;
  };
  
  // Client information
  clientInfo?: {
    id: string;
    name: string;
    email: string;
    type: 'Individual' | 'Legal Entity';
  };
  
  // Payment method names for display
  paymentMethodNames: string[];
}

// Form interfaces for creating/editing invoices
export interface NewInvoiceItem {
  productId: string;
  quantity: number;
}

export interface InvoiceFormData {
  invoiceNumber: string;
  clientId: string;
  items: NewInvoiceItem[];
  issueDate: string;
  dueDate: string;
  taxRate: string;
  fromCompanyId: number | string | '';
  paymentMethodIds: string[];
  notes: string;
  currency?: string;
}

// Legacy interface for backward compatibility
export interface NewInvoice extends InvoiceFormData {}

// Filter and search interfaces
export interface InvoiceFilters {
  searchTerm: string;
  statusFilter: 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'archived';
  companyFilter: number | 'all';
  clientFilter: string;
  dateRangeFilter: 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear';
  currencyFilter: string;
}

// Statistics interface
export interface InvoiceStatistics {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  archived: number;
  totalValue: number;
  paidValue: number;
  overdueValue: number;
  averageValue: number;
  totalValueFormatted: string;
  paidValueFormatted: string;
  overdueValueFormatted: string;
  averageValueFormatted: string;
}

// Period types for filtering
export type PaidPeriod = 'today' | 'week' | 'thisMonth' | 'lastMonth' | 'last6Months' | 'thisYear' | 'lastYear' | 'allTime';

export type ViewMode = 'active' | 'paid' | 'archived';

export type SortField = 'createdAt' | 'dueDate' | 'invoiceNumber' | 'company' | 'client' | 'amount';
export type SortDirection = 'asc' | 'desc';

// Status configuration
export interface StatusConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
}

// Validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface InvoiceValidationError {
  field: string;
  message: string;
}

// Business rule interfaces
export interface InvoiceBusinessRules {
  allowNegativeAmounts: boolean;
  requirePaymentMethods: boolean;
  autoCalculateOverdue: boolean;
  defaultTaxRate: number;
  invoiceNumberPrefix: string;
}

// PDF generation interface
export interface PDFGenerationOptions {
  template: string;
  showWatermark: boolean;
  includePaymentInstructions: boolean;
  customNotes?: string;
}

// Exchange rate interface
export interface ExchangeRates {
  [currency: string]: number;
}

// Update result interface for service operations
export interface InvoiceUpdateResult {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

// Bulk operation interfaces
export interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  errors: string[];
}

// Invoice calculation interface
export interface InvoiceCalculation {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

// Legacy migration interface
export interface LegacyInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  description?: string; // Legacy field
  amount?: number; // Legacy field
  currency: string;
  status: string;
  dueDate: string;
  issueDate: string;
  taxRate?: number;
  fromCompanyId: number;
  template?: string;
}

// Constants for invoice statuses
export const INVOICE_STATUSES: StatusConfig[] = [
  { value: 'draft', label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  { value: 'sent', label: 'Sent', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  { value: 'paid', label: 'Paid', color: 'text-green-700', bgColor: 'bg-green-100' },
  { value: 'overdue', label: 'Overdue', color: 'text-red-700', bgColor: 'bg-red-100' },
  { value: 'archived', label: 'Archived', color: 'text-gray-500', bgColor: 'bg-gray-50' }
];

// Invoice templates
export const INVOICE_TEMPLATES = [
  'professional',
  'modern',
  'classic',
  'minimal'
] as const;

export type InvoiceTemplate = typeof INVOICE_TEMPLATES[number];
