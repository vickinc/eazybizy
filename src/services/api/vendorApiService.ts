export interface VendorQueryParams {
  skip?: number
  take?: number
  search?: string
  status?: 'all' | 'active' | 'inactive'
  company?: string | 'all'
  sortField?: 'companyName' | 'contactEmail' | 'contactPerson' | 'currency' | 'createdAt'
  sortDirection?: 'asc' | 'desc'
}

export interface VendorFormData {
  companyId?: number
  companyName: string
  contactPerson?: string
  contactEmail: string
  phone?: string
  website?: string
  paymentTerms?: string
  currency?: string
  paymentMethod?: string
  billingAddress?: string
  itemsServicesSold?: string
  notes?: string
  companyRegistrationNr?: string
  vatNr?: string
  vendorCountry?: string
  isActive?: boolean
  productIds?: string[]
}

export interface Vendor {
  id: string
  companyId: number
  companyName: string
  contactPerson?: string
  contactEmail: string
  phone?: string
  website?: string
  paymentTerms: string
  currency: string
  paymentMethod: string
  billingAddress?: string
  itemsServicesSold?: string
  notes?: string
  companyRegistrationNr?: string
  vatNr?: string
  vendorCountry?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  
  // Relations
  company?: {
    id: number
    tradingName: string
    legalName: string
    logo?: string
  }
  
  products?: Array<{
    id: string
    name: string
    price: number
    currency: string
    isActive?: boolean
  }>
}

export interface VendorsResponse {
  data: Vendor[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  statistics: {
    total: number
    active: number
    inactive: number
  }
}

export interface VendorStatistics {
  summary: {
    totalVendors: number
    activeVendors: number
    inactiveVendors: number
    activePercentage: number
    mostPopularCountry: string | null
    mostPopularCurrency: string | null
    mostPopularPaymentMethod: string | null
    recentVendorsCount: number
    avgPaymentTerms: number
  }
  statusBreakdown: {
    active: {
      count: number
      percentage: number
    }
    inactive: {
      count: number
      percentage: number
    }
  }
  countryBreakdown: Array<{
    country: string
    count: number
    percentage: number
  }>
  currencyBreakdown: Array<{
    currency: string
    count: number
    percentage: number
  }>
  paymentMethodBreakdown: Array<{
    method: string
    count: number
    percentage: number
  }>
  recentVendors: Array<{
    id: string
    companyName: string
    contactEmail: string
    isActive: boolean
    createdAt: string
    company: string
  }>
  topVendors: Array<{
    id: string
    companyName: string
    contactEmail: string
    isActive: boolean
    currency: string
    productCount: number
    company: string
  }>
  insights: {
    healthScore: number
    recommendations: string[]
  }
}

export class VendorApiService {
  private baseUrl = '/api/vendors'

  // Basic CRUD Operations
  async getVendors(params: VendorQueryParams): Promise<VendorsResponse> {
    const queryParams = new URLSearchParams()

    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params.take !== undefined) queryParams.append('take', params.take.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.status && params.status !== 'all') queryParams.append('status', params.status)
    if (params.company && params.company !== 'all') queryParams.append('company', params.company)
    if (params.sortField) queryParams.append('sortField', params.sortField)
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection)

    const response = await fetch(`${this.baseUrl}?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch vendors: ${response.status}`)
    }
    return response.json()
  }

  async getVendor(id: string): Promise<Vendor> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch vendor: ${response.status}`)
    }
    return response.json()
  }

  async createVendor(data: VendorFormData): Promise<Vendor> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to create vendor: ${response.status}`)
    }
    return response.json()
  }

  async updateVendor(id: string, data: Partial<VendorFormData>): Promise<Vendor> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to update vendor: ${response.status}`)
    }
    return response.json()
  }

  async deleteVendor(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`Failed to delete vendor: ${response.status}`)
    }
    return response.json()
  }

  // Statistics and Analytics
  async getStatistics(options?: {
    companyId?: number
  }): Promise<VendorStatistics> {
    const queryParams = new URLSearchParams()

    if (options?.companyId) queryParams.append('companyId', options.companyId.toString())

    const response = await fetch(`${this.baseUrl}/statistics?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch vendor statistics: ${response.status}`)
    }
    return response.json()
  }

  // Search and Filtering
  async searchVendors(query: string, filters?: Partial<VendorQueryParams>): Promise<VendorsResponse> {
    const params: VendorQueryParams = {
      search: query,
      ...filters
    }
    return this.getVendors(params)
  }

  async getVendorsByCompany(companyId: number, options?: Partial<VendorQueryParams>): Promise<VendorsResponse> {
    const params: VendorQueryParams = {
      company: companyId.toString(),
      ...options
    }
    return this.getVendors(params)
  }

  async getActiveVendors(companyId?: number): Promise<Vendor[]> {
    const params: VendorQueryParams = {
      status: 'active',
      ...(companyId && { company: companyId.toString() })
    }
    const response = await this.getVendors(params)
    return response.data
  }

  async getInactiveVendors(companyId?: number): Promise<Vendor[]> {
    const params: VendorQueryParams = {
      status: 'inactive',
      ...(companyId && { company: companyId.toString() })
    }
    const response = await this.getVendors(params)
    return response.data
  }

  // Vendor Status Operations
  async toggleVendorStatus(id: string): Promise<Vendor> {
    const vendor = await this.getVendor(id)
    return this.updateVendor(id, { isActive: !vendor.isActive })
  }

  async activateVendor(id: string): Promise<Vendor> {
    return this.updateVendor(id, { isActive: true })
  }

  async deactivateVendor(id: string): Promise<Vendor> {
    return this.updateVendor(id, { isActive: false })
  }

  // Utility Methods
  async validateVendorEmail(email: string, excludeId?: string): Promise<{ isValid: boolean; error?: string }> {
    const queryParams = new URLSearchParams()
    queryParams.append('email', email)
    if (excludeId) queryParams.append('excludeId', excludeId)

    const response = await fetch(`${this.baseUrl}/validate-email?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to validate vendor email: ${response.status}`)
    }
    return response.json()
  }

  // Bulk Operations (if needed in the future)
  async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<{ success: boolean; updated: number; message: string }> {
    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'updateStatus',
        data: { ids, isActive }
      }),
    })
    if (!response.ok) {
      throw new Error(`Failed to bulk update vendor status: ${response.status}`)
    }
    return response.json()
  }

  async bulkDelete(ids: string[]): Promise<{ success: boolean; deleted: number; message: string }> {
    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'delete',
        data: { ids }
      }),
    })
    if (!response.ok) {
      throw new Error(`Failed to bulk delete vendors: ${response.status}`)
    }
    return response.json()
  }
}

export const vendorApiService = new VendorApiService()