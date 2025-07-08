export interface ClientQueryParams {
  skip?: number
  take?: number
  search?: string
  status?: 'all' | 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'ARCHIVED'
  industry?: string
  company?: string | 'all'
  sortField?: 'name' | 'email' | 'industry' | 'totalInvoiced' | 'lastInvoiceDate' | 'createdAt'
  sortDirection?: 'asc' | 'desc'
}

export interface ClientFormData {
  companyId?: number
  clientType: 'INDIVIDUAL' | 'LEGAL_ENTITY'
  name: string
  contactPersonName?: string
  contactPersonPosition?: string
  email: string
  phone?: string
  website?: string
  address?: string
  city?: string
  zipCode?: string
  country?: string
  industry?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'ARCHIVED'
  notes?: string
  registrationNumber?: string
  vatNumber?: string
  passportNumber?: string
  dateOfBirth?: string
}

export interface Client {
  id: string
  companyId?: number
  clientType: string
  name: string
  contactPersonName?: string
  contactPersonPosition?: string
  email: string
  phone?: string
  website?: string
  address?: string
  city?: string
  zipCode?: string
  country?: string
  industry?: string
  status: 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'ARCHIVED'
  notes?: string
  registrationNumber?: string
  vatNumber?: string
  passportNumber?: string
  dateOfBirth?: string
  totalInvoiced: number
  totalPaid: number
  lastInvoiceDate?: string
  createdAt: string
  updatedAt: string
  
  // Relations
  company?: {
    id: number
    tradingName: string
    legalName: string
    logo?: string
  }
  
  // Calculated statistics
  calculatedStats?: {
    totalInvoices: number
    totalInvoiced: number
    totalPaid: number
    totalOverdue: number
    totalPending: number
    lastInvoiceDate?: string
    averagePaymentDays?: number
    statusBreakdown: Record<string, number>
    paymentRate: number
  }
  
  // Recent invoices for quick overview
  invoices?: Array<{
    id: string
    totalAmount: number
    currency: string
    status: string
    issueDate: string
    dueDate: string
    paidDate?: string
  }>
  
  _count?: {
    invoices: number
  }
}

export interface ClientsResponse {
  data: Client[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  statistics: {
    total: number
    totalRevenue: number
    totalPaid: number
    statusStats: Record<string, number>
  }
}

export interface ClientStatistics {
  summary: {
    totalClients: number
    totalRevenue: number
    totalPaid: number
    averageClientValue: number
    largestClient: number
    smallestClient: number
    collectionRate: number
    clientsWithInvoices: number
    averageInvoiceValue: number
    payingClients: number
    averagePaymentDays: number
  }
  statusBreakdown: Record<string, {
    count: number
    totalInvoiced: number
    totalPaid: number
    avgInvoiced: number
    percentage: number
  }>
  industryBreakdown: Array<{
    industry: string
    count: number
    totalInvoiced: number
    totalPaid: number
    percentage: number
  }>
  invoiceAnalysis: {
    totalInvoices: number
    averageInvoiceValue: number
    totalPaid: number
    totalOverdue: number
    totalPending: number
    paidPercentage: number
  }
  paymentAnalysis: {
    averagePaymentDays: number
    fastestPaymentDays: number
    slowestPaymentDays: number
    payingClientsCount: number
  }
  topClients: Array<{
    id: string
    name: string
    industry?: string
    totalInvoiced: number
    totalPaid: number
    lastInvoiceDate?: string
    paymentRate: number
    _count: {
      invoices: number
    }
  }>
  recentClients: Array<{
    id: string
    name: string
    industry?: string
    createdAt: string
    status: string
    totalInvoiced: number
  }>
  trends: {
    monthly: any[]
  }
  insights: {
    topIndustry: string | null
    mostValuableClient: string | null
    healthScore: number
    recommendations: string[]
  }
}

export class ClientsApiService {
  private baseUrl = '/api/clients'

  // Basic CRUD Operations
  async getClients(params: ClientQueryParams): Promise<ClientsResponse> {
    const queryParams = new URLSearchParams()

    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params.take !== undefined) queryParams.append('take', params.take.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.status && params.status !== 'all') queryParams.append('status', params.status)
    if (params.industry) queryParams.append('industry', params.industry)
    if (params.company && params.company !== 'all') queryParams.append('company', params.company)
    if (params.sortField) queryParams.append('sortField', params.sortField)
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection)

    const response = await fetch(`${this.baseUrl}?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.status}`)
    }
    return response.json()
  }

  async getClient(id: string): Promise<Client> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch client: ${response.status}`)
    }
    return response.json()
  }

  async createClient(data: ClientFormData): Promise<Client> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      let errorMessage = `Failed to create client: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage = `Failed to create client: ${errorData.error}`
        }
      } catch (e) {
        // If we can't parse the error response, use the status code
      }
      throw new Error(errorMessage)
    }
    return response.json()
  }

  async updateClient(id: string, data: Partial<ClientFormData>): Promise<Client> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to update client: ${response.status}`)
    }
    return response.json()
  }

  async deleteClient(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`Failed to delete client: ${response.status}`)
    }
    return response.json()
  }

  // Statistics and Analytics
  async getStatistics(options?: {
    companyId?: number
    period?: string
    dateFrom?: string
    dateTo?: string
    status?: string
    industry?: string
  }): Promise<ClientStatistics> {
    const queryParams = new URLSearchParams()

    if (options?.companyId) queryParams.append('companyId', options.companyId.toString())
    if (options?.period) queryParams.append('period', options.period)
    if (options?.dateFrom) queryParams.append('dateFrom', options.dateFrom)
    if (options?.dateTo) queryParams.append('dateTo', options.dateTo)
    if (options?.status) queryParams.append('status', options.status)
    if (options?.industry) queryParams.append('industry', options.industry)

    const response = await fetch(`${this.baseUrl}/statistics?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch client statistics: ${response.status}`)
    }
    return response.json()
  }

  // Search and Filtering
  async searchClients(query: string, filters?: Partial<ClientQueryParams>): Promise<ClientsResponse> {
    const params: ClientQueryParams = {
      search: query,
      ...filters
    }
    return this.getClients(params)
  }

  async getClientsByCompany(companyId: number, options?: Partial<ClientQueryParams>): Promise<ClientsResponse> {
    const params: ClientQueryParams = {
      company: companyId.toString(),
      ...options
    }
    return this.getClients(params)
  }

  async getClientsByIndustry(industry: string, options?: Partial<ClientQueryParams>): Promise<ClientsResponse> {
    const params: ClientQueryParams = {
      industry,
      ...options
    }
    return this.getClients(params)
  }

  async getInactiveClients(companyId?: number): Promise<Client[]> {
    const params: ClientQueryParams = {
      status: 'INACTIVE',
      ...(companyId && { company: companyId.toString() })
    }
    const response = await this.getClients(params)
    return response.data
  }

  async getTopClients(limit = 10, companyId?: number): Promise<Client[]> {
    const params: ClientQueryParams = {
      sortField: 'totalInvoiced',
      sortDirection: 'desc',
      take: limit,
      ...(companyId && { company: companyId.toString() })
    }
    const response = await this.getClients(params)
    return response.data
  }

  // Client-Invoice Relationship Methods
  async getClientInvoices(clientId: string, options?: {
    skip?: number
    take?: number
    status?: string
    sortField?: string
    sortDirection?: string
  }) {
    const queryParams = new URLSearchParams()
    
    if (options?.skip !== undefined) queryParams.append('skip', options.skip.toString())
    if (options?.take !== undefined) queryParams.append('take', options.take.toString())
    if (options?.status) queryParams.append('status', options.status)
    if (options?.sortField) queryParams.append('sortField', options.sortField)
    if (options?.sortDirection) queryParams.append('sortDirection', options.sortDirection)

    const response = await fetch(`${this.baseUrl}/${clientId}/invoices?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch client invoices: ${response.status}`)
    }
    return response.json()
  }

  async getClientPaymentHistory(clientId: string) {
    const response = await fetch(`${this.baseUrl}/${clientId}/payments`)
    if (!response.ok) {
      throw new Error(`Failed to fetch client payment history: ${response.status}`)
    }
    return response.json()
  }

  // Utility Methods
  async validateClientEmail(email: string, excludeId?: string): Promise<{ isValid: boolean; error?: string }> {
    const queryParams = new URLSearchParams()
    queryParams.append('email', email)
    if (excludeId) queryParams.append('excludeId', excludeId)

    const response = await fetch(`${this.baseUrl}/validate-email?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to validate client email: ${response.status}`)
    }
    return response.json()
  }

  async getIndustries(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/industries`)
    if (!response.ok) {
      throw new Error(`Failed to fetch industries: ${response.status}`)
    }
    return response.json()
  }

  // Bulk Operations
  async bulkUpdateStatus(ids: string[], status: string, updatedBy?: string): Promise<{ success: boolean; updated: number; message: string }> {
    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'updateStatus',
        data: { ids, status, updatedBy }
      }),
    })
    if (!response.ok) {
      throw new Error(`Failed to bulk update client status: ${response.status}`)
    }
    return response.json()
  }

  async bulkDelete(ids: string[], deletedBy?: string): Promise<{ success: boolean; deleted: number; message: string }> {
    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'delete',
        data: { ids, deletedBy }
      }),
    })
    if (!response.ok) {
      throw new Error(`Failed to bulk delete clients: ${response.status}`)
    }
    return response.json()
  }

  async bulkExport(ids: string[], format: 'json' | 'csv' = 'json'): Promise<{ success: boolean; data: any; message: string }> {
    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'export',
        data: { ids, format }
      }),
    })
    if (!response.ok) {
      throw new Error(`Failed to bulk export clients: ${response.status}`)
    }
    return response.json()
  }
}

export const clientsApiService = new ClientsApiService()