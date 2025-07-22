import { VATTreatment, VATTreatmentFormData, VATCategory, VATApplicability } from '@/types/vatTreatment.types'

export interface VATTreatmentsResponse {
  data: VATTreatment[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  statistics: {
    total: number
    averageRate: number
    categoryStats: Record<string, number>
    activeStats: Record<string, number>
  }
}

export interface VATTreatmentsQueryParams {
  skip?: number
  take?: number
  search?: string
  category?: VATCategory | string
  isActive?: boolean | string
  applicability?: VATApplicability | string
  company?: number | 'all'
  minRate?: number
  maxRate?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export class VATTreatmentsApiService {
  private baseUrl = '/api/vat-treatments'

  async getVATTreatments(params: VATTreatmentsQueryParams = {}): Promise<VATTreatmentsResponse> {
    const searchParams = new URLSearchParams()
    
    // Add pagination
    if (params.skip !== undefined) searchParams.set('skip', params.skip.toString())
    if (params.take !== undefined) searchParams.set('take', params.take.toString())
    
    // Add filters
    if (params.search) searchParams.set('search', params.search)
    if (params.category && params.category !== 'all') searchParams.set('category', params.category)
    if (params.isActive !== undefined && params.isActive !== 'all') {
      searchParams.set('isActive', params.isActive.toString())
    }
    if (params.applicability && params.applicability !== 'all') {
      searchParams.set('applicability', params.applicability)
    }
    if (params.company && params.company !== 'all') {
      searchParams.set('company', params.company.toString())
    }
    if (params.minRate !== undefined) searchParams.set('minRate', params.minRate.toString())
    if (params.maxRate !== undefined) searchParams.set('maxRate', params.maxRate.toString())
    
    // Add sorting
    if (params.sortField) searchParams.set('sortField', params.sortField)
    if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection)

    const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch VAT treatments')
    }
    
    return response.json()
  }

  async getVATTreatment(id: string): Promise<VATTreatment> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('VAT treatment not found')
      }
      throw new Error('Failed to fetch VAT treatment')
    }
    
    return response.json()
  }

  async createVATTreatment(data: VATTreatmentFormData & { companyId?: number; isDefault?: boolean }): Promise<VATTreatment> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        rate: parseFloat(data.rate), // Convert string rate to number
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to create VAT treatment')
    }
    
    return response.json()
  }

  async updateVATTreatment(id: string, data: Partial<VATTreatmentFormData>): Promise<VATTreatment> {
    const updateData = { ...data }
    if (updateData.rate) {
      updateData.rate = parseFloat(updateData.rate as string).toString() // Ensure it's a string for the API
    }

    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to update VAT treatment')
    }
    
    return response.json()
  }

  async deleteVATTreatment(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to delete VAT treatment')
    }
  }

  // Utility method for bulk operations (optional)
  async bulkCreateVATTreatments(treatments: (VATTreatmentFormData & { companyId?: number; isDefault?: boolean })[]): Promise<VATTreatment[]> {
    const promises = treatments.map(treatment => this.createVATTreatment(treatment))
    return Promise.all(promises)
  }

  // Utility method to get treatments by category
  async getTreatmentsByCategory(category: VATCategory, companyId?: number): Promise<VATTreatment[]> {
    const params: VATTreatmentsQueryParams = {
      category,
      take: 1000, // Large number to get all treatments of this category
    }
    
    if (companyId) {
      params.company = companyId
    }
    
    const response = await this.getVATTreatments(params)
    return response.data
  }

  // Utility method to get treatments by applicability
  async getTreatmentsByApplicability(applicability: VATApplicability, companyId?: number): Promise<VATTreatment[]> {
    const params: VATTreatmentsQueryParams = {
      applicability,
      take: 1000, // Large number to get all treatments with this applicability
    }
    
    if (companyId) {
      params.company = companyId
    }
    
    const response = await this.getVATTreatments(params)
    return response.data
  }

  // Utility method to search treatments
  async searchTreatments(searchTerm: string, companyId?: number): Promise<VATTreatment[]> {
    const params: VATTreatmentsQueryParams = {
      search: searchTerm,
      take: 100, // Reasonable limit for search results
    }
    
    if (companyId) {
      params.company = companyId
    }
    
    const response = await this.getVATTreatments(params)
    return response.data
  }

  // Utility method to check if treatment code is unique
  async isTreatmentCodeUnique(code: string, excludeId?: string): Promise<boolean> {
    try {
      const response = await this.getVATTreatments({ search: code, take: 1 })
      const exactMatch = response.data.find(treatment => 
        treatment.code === code && treatment.id !== excludeId
      )
      return !exactMatch
    } catch (error) {
      console.error('Error checking treatment code uniqueness:', error)
      return false
    }
  }

  // Utility method to get active treatments only
  async getActiveTreatments(companyId?: number): Promise<VATTreatment[]> {
    const params: VATTreatmentsQueryParams = {
      isActive: true,
      take: 1000, // Large number to get all active treatments
    }
    
    if (companyId) {
      params.company = companyId
    }
    
    const response = await this.getVATTreatments(params)
    return response.data
  }

  // Utility method to get default treatments
  async getDefaultTreatments(): Promise<VATTreatment[]> {
    const response = await this.getVATTreatments({ take: 1000 })
    return response.data.filter(treatment => treatment.isDefault)
  }

  // Utility method to get treatments by rate range
  async getTreatmentsByRateRange(minRate: number, maxRate: number, companyId?: number): Promise<VATTreatment[]> {
    const params: VATTreatmentsQueryParams = {
      minRate,
      maxRate,
      take: 1000, // Large number to get all treatments in this range
    }
    
    if (companyId) {
      params.company = companyId
    }
    
    const response = await this.getVATTreatments(params)
    return response.data
  }
}