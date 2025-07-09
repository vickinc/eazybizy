export interface InvoiceQueryParams {
  skip?: number
  take?: number
  search?: string
  status?: 'all' | 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'ARCHIVED'
  company?: string | 'all'
  client?: string
  currency?: string
  dateRange?: 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'lastYear' | 'custom'
  dateFrom?: string
  dateTo?: string
  sortField?: 'invoiceNumber' | 'client' | 'amount' | 'dueDate' | 'company' | 'createdAt' | 'sentDate' | 'paidDate' | 'currency' | 'paymentMethod'
  sortDirection?: 'asc' | 'desc'
}

export interface InvoiceFormData {
  invoiceNumber: string
  clientName: string
  clientEmail: string
  clientAddress?: string
  clientId?: string
  subtotal: number
  currency: string
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'ARCHIVED'
  dueDate: string
  issueDate: string
  paidDate?: string
  template?: string
  taxRate?: number
  taxAmount?: number
  totalAmount: number
  fromCompanyId: number
  notes?: string
  items: InvoiceItem[]
  paymentMethodIds?: string[]
}

export interface InvoiceItem {
  productId: string
  productName: string
  description: string
  quantity: number
  unitPrice: number
  currency: string
  total: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string
  clientAddress?: string
  clientId?: string
  subtotal: number
  currency: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'ARCHIVED'
  dueDate: string
  issueDate: string
  paidDate?: string
  template: string
  taxRate: number
  taxAmount: number
  totalAmount: number
  fromCompanyId: number
  notes?: string
  createdAt: string
  updatedAt: string
  
  // Relations
  company?: {
    id: number
    tradingName: string
    legalName: string
    logo?: string
  }
  client?: {
    id: string
    name: string
    email: string
    clientType: string
  }
  items: Array<InvoiceItem & {
    id: string
    invoiceId: string
    createdAt: string
    updatedAt: string
    product?: {
      id: string
      name: string
      price: number
      currency: string
    }
  }>
  paymentMethodInvoices?: Array<{
    id: string
    paymentMethodId: string
    paymentMethod: {
      id: string
      name: string
      type: string
    }
  }>
}

export interface InvoicesResponse {
  data: Invoice[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  statistics: {
    total: number
    totalValue: number
    statusStats: Record<string, { count: number; value: number }>
  }
}

export interface InvoiceStatistics {
  summary: {
    totalInvoices: number
    totalValue: number
    averageInvoiceValue: number
    largestInvoice: number
    smallestInvoice: number
    totalTax: number
    totalSubtotal: number
    uniqueClients: number
    currenciesUsed: number
    collectionRate: number
    averagePaymentTerms: number
  }
  statusBreakdown: Record<string, {
    count: number
    value: number
    avgValue: number
    percentage: number
  }>
  currencyBreakdown: Array<{
    currency: string
    _sum: {
      totalAmount?: number
      subtotal?: number
      taxAmount?: number
    }
    _count: number
  }>
  clientBreakdown: Array<{
    clientId: string
    clientName: string
    totalValue: number
    invoiceCount: number
    averageValue: number
  }>
  overdueAnalysis: {
    count: number
    totalValue: number
    averageValue: number
    percentage: number
  }
  paymentAnalysis: {
    averagePaymentDays: number
    fastestPaymentDays: number
    slowestPaymentDays: number
    paidInvoicesCount: number
  }
  trends: {
    monthly: unknown[]
  }
  insights: {
    mostValuableClient: string | null
    primaryCurrency: string | null
    healthScore: number
    recommendations: string[]
  }
}

export interface BulkInvoiceOperation {
  operation: 'updateStatus' | 'archive' | 'delete' | 'markPaid' | 'send' | 'duplicate' | 'export'
  data: unknown
}

export interface BulkOperationResponse {
  success: boolean
  updated?: number
  created?: number
  deleted?: number
  archived?: number
  sent?: number
  duplicated?: number
  exported?: number
  skipped?: number
  message: string
  invoices?: Invoice[]
  data?: unknown
}

export interface WorkflowOperation {
  sendDate?: string
  emailSent?: boolean
  paidDate?: string
  paidAmount?: number
  paymentMethod?: string
  transactionReference?: string
  notes?: string
  updatedBy?: string
  createTransaction?: boolean
}

export interface DuplicateOperation {
  newIssueDate?: string
  newDueDate?: string
  newClientId?: string
  adjustInvoiceNumber?: boolean
  copyNotes?: boolean
  updatedBy?: string
}

export class InvoicesApiService {
  private baseUrl = '/api/invoices'

  // Basic CRUD Operations
  async getInvoices(params: InvoiceQueryParams): Promise<InvoicesResponse> {
    const queryParams = new URLSearchParams()

    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params.take !== undefined) queryParams.append('take', params.take.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.status && params.status !== 'all') queryParams.append('status', params.status)
    if (params.company && params.company !== 'all') queryParams.append('company', params.company)
    if (params.client) queryParams.append('client', params.client)
    if (params.currency) queryParams.append('currency', params.currency)
    if (params.dateRange && params.dateRange !== 'all') queryParams.append('dateRange', params.dateRange)
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params.sortField) queryParams.append('sortField', params.sortField)
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection)

    const response = await fetch(`${this.baseUrl}?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch invoices: ${response.status}`)
    }
    return response.json()
  }

  async getInvoice(id: string): Promise<Invoice> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch invoice: ${response.status}`)
    }
    return response.json()
  }

  async createInvoice(data: InvoiceFormData): Promise<Invoice> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to create invoice: ${response.status}`)
    }
    return response.json()
  }

  async updateInvoice(id: string, data: Partial<InvoiceFormData>): Promise<Invoice> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to update invoice: ${response.status}`)
    }
    return response.json()
  }

  async deleteInvoice(id: string, hardDelete = false): Promise<{ success: boolean }> {
    const queryParams = new URLSearchParams()
    if (hardDelete) queryParams.append('hard', 'true')

    const response = await fetch(`${this.baseUrl}/${id}?${queryParams}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`Failed to delete invoice: ${response.status}`)
    }
    return response.json()
  }

  // Workflow Operations
  async sendInvoice(id: string, options: WorkflowOperation = {}): Promise<{ success: boolean; invoice: Invoice; message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })
    if (!response.ok) {
      throw new Error(`Failed to send invoice: ${response.status}`)
    }
    return response.json()
  }

  async markInvoicePaid(id: string, options: WorkflowOperation = {}): Promise<{ success: boolean; invoice: Invoice; transaction?: unknown; message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })
    if (!response.ok) {
      throw new Error(`Failed to mark invoice as paid: ${response.status}`)
    }
    return response.json()
  }

  async duplicateInvoice(id: string, options: DuplicateOperation = {}): Promise<{ success: boolean; originalInvoice: unknown; duplicatedInvoice: Invoice; message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}/duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })
    if (!response.ok) {
      throw new Error(`Failed to duplicate invoice: ${response.status}`)
    }
    return response.json()
  }

  // Statistics and Analytics
  async getStatistics(options?: {
    companyId?: number
    period?: string
    dateFrom?: string
    dateTo?: string
    currency?: string
    clientId?: string
    status?: string
  }): Promise<InvoiceStatistics> {
    const queryParams = new URLSearchParams()

    if (options?.companyId) queryParams.append('companyId', options.companyId.toString())
    if (options?.period) queryParams.append('period', options.period)
    if (options?.dateFrom) queryParams.append('dateFrom', options.dateFrom)
    if (options?.dateTo) queryParams.append('dateTo', options.dateTo)
    if (options?.currency) queryParams.append('currency', options.currency)
    if (options?.clientId) queryParams.append('clientId', options.clientId)
    if (options?.status) queryParams.append('status', options.status)

    const response = await fetch(`${this.baseUrl}/statistics?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch invoice statistics: ${response.status}`)
    }
    return response.json()
  }

  // Bulk Operations
  async bulkUpdateStatus(ids: string[], status: string, updatedBy?: string, notes?: string): Promise<BulkOperationResponse> {
    return this.bulkOperation('updateStatus', { ids, status, updatedBy, notes })
  }

  async bulkArchive(ids: string[], updatedBy?: string): Promise<BulkOperationResponse> {
    return this.bulkOperation('archive', { ids, updatedBy })
  }

  async bulkDelete(ids: string[], hardDelete = false, deletedBy?: string): Promise<BulkOperationResponse> {
    return this.bulkOperation('delete', { ids, hardDelete, deletedBy })
  }

  async bulkMarkPaid(ids: string[], options: WorkflowOperation = {}): Promise<BulkOperationResponse> {
    return this.bulkOperation('markPaid', { ids, ...options })
  }

  async bulkSend(ids: string[], options: WorkflowOperation = {}): Promise<BulkOperationResponse> {
    return this.bulkOperation('send', { ids, ...options })
  }

  async bulkDuplicate(ids: string[], options: DuplicateOperation = {}): Promise<BulkOperationResponse> {
    return this.bulkOperation('duplicate', { ids, ...options })
  }

  async bulkExport(ids: string[], format: 'json' | 'csv' | 'pdf' = 'json', includeItems = true): Promise<BulkOperationResponse> {
    return this.bulkOperation('export', { ids, format, includeItems })
  }

  private async bulkOperation(operation: string, data: unknown): Promise<BulkOperationResponse> {
    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operation, data }),
    })
    if (!response.ok) {
      throw new Error(`Failed to perform bulk ${operation}: ${response.status}`)
    }
    return response.json()
  }

  // Utility Methods
  async getNextInvoiceNumber(companyId: number, prefix?: string): Promise<string> {
    const queryParams = new URLSearchParams()
    queryParams.append('companyId', companyId.toString())
    if (prefix) queryParams.append('prefix', prefix)

    const response = await fetch(`${this.baseUrl}/next-number?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to get next invoice number: ${response.status}`)
    }
    const result = await response.json()
    return result.nextNumber
  }

  async validateInvoiceNumber(invoiceNumber: string, companyId: number, excludeId?: string): Promise<{ isValid: boolean; error?: string }> {
    const queryParams = new URLSearchParams()
    queryParams.append('number', invoiceNumber)
    queryParams.append('companyId', companyId.toString())
    if (excludeId) queryParams.append('excludeId', excludeId)

    const response = await fetch(`${this.baseUrl}/validate-number?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to validate invoice number: ${response.status}`)
    }
    return response.json()
  }

  // Search and Filtering
  async searchInvoices(query: string, filters?: Partial<InvoiceQueryParams>): Promise<InvoicesResponse> {
    const params: InvoiceQueryParams = {
      search: query,
      ...filters
    }
    return this.getInvoices(params)
  }

  async getOverdueInvoices(companyId?: number): Promise<Invoice[]> {
    const params: InvoiceQueryParams = {
      status: 'OVERDUE',
      ...(companyId && { company: companyId.toString() })
    }
    const response = await this.getInvoices(params)
    return response.data
  }

  async getInvoicesByClient(clientId: string, options?: Partial<InvoiceQueryParams>): Promise<InvoicesResponse> {
    const params: InvoiceQueryParams = {
      client: clientId,
      ...options
    }
    return this.getInvoices(params)
  }

  async getInvoicesByCompany(companyId: number, options?: Partial<InvoiceQueryParams>): Promise<InvoicesResponse> {
    const params: InvoiceQueryParams = {
      company: companyId.toString(),
      ...options
    }
    return this.getInvoices(params)
  }
}

export const invoicesApiService = new InvoicesApiService()